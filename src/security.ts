/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
 
 
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { App } from 'obsidian';

export interface GitHubToken {
	id: string;
	name: string;
	token: string;
}

export class TokenManager {
	private app: App;
	private secretId: string;

	constructor(app: App) {
		this.app = app;
		// SecretStorage IDs must be lowercase alphanumeric with optional dashes
		this.secretId = 'github-pr-autocomplete-tokens';
	}

	private getLegacyV2StorageKey(): string {
		return `github-pr-autocomplete-${this.app.vault.getName()}-token-v2`;
	}

	private getLegacyV1StorageKey(): string {
		return `github-pr-autocomplete-${this.app.vault.getName()}-token-v1`;
	}

	private getElectronSafeStorage() {
		try {
			// Require electron to access safeStorage (Desktop only)
			// @ts-ignore
			// eslint-disable-next-line no-undef
			const electron = typeof require !== 'undefined' ? require('electron') : null;
			if (electron?.remote?.safeStorage) {
				return electron.remote.safeStorage;
			}
			if (electron?.safeStorage) {
				return electron.safeStorage;
			}
		} catch {
			// Not on desktop or electron not available
		}
		return null;
	}

	saveTokens(tokens: GitHubToken[]): void {
		const tokensJson = JSON.stringify(tokens);
		if (this.app.secretStorage) {
			this.app.secretStorage.setSecret(this.secretId, tokensJson);
		} else {
			console.error('GitHub Autocomplete: SecretStorage API is missing.');
		}
	}

	loadTokens(): GitHubToken[] {
		// 1. Try loading from Obsidian's new SecretStorage
		if (this.app.secretStorage) {
			const secretStr = this.app.secretStorage.getSecret(this.secretId);
			if (secretStr) {
				try {
					const parsed = JSON.parse(secretStr);
					if (Array.isArray(parsed)) {
						return parsed as GitHubToken[];
					}
				} catch (e) {
					console.error("GitHub Autocomplete: Failed to parse tokens from SecretStorage", e);
				}
			}
		}

		// 2. If nothing in SecretStorage, check for v2 legacy (Electron encrypted localStorage)
		const legacyV2Tokens = this.migrateFromV2();
		if (legacyV2Tokens.length > 0) {
			this.saveTokens(legacyV2Tokens);
			return legacyV2Tokens;
		}

		// 3. Check for v1 legacy
		const legacyV1Tokens = this.migrateFromV1();
		if (legacyV1Tokens.length > 0) {
			this.saveTokens(legacyV1Tokens);
			return legacyV1Tokens;
		}

		return [];
	}

	private migrateFromV2(): GitHubToken[] {
		const legacyKey = this.getLegacyV2StorageKey();
		const dataStr = window.localStorage.getItem(legacyKey);
		if (!dataStr) return [];

		try {
			 
			const data = JSON.parse(dataStr);
			 
			let tokensJson = data.value as string;

			 
			if (data.encrypted) {
				const safeStorage = this.getElectronSafeStorage();
				 
				if (safeStorage && safeStorage.isEncryptionAvailable()) {
					let buffer;
					 
					if (typeof (globalThis as any).Buffer !== 'undefined') {
						 
						buffer = (globalThis as any).Buffer.from(tokensJson, 'base64');
					} else {
						const binary_string = window.atob(tokensJson);
						const len = binary_string.length;
						const bytes = new Uint8Array(len);
						for (let i = 0; i < len; i++) {
							bytes[i] = binary_string.charCodeAt(i);
						}
						 
						const GlobalBuffer = (globalThis as any).Buffer;
						if (GlobalBuffer) {
							 
							buffer = GlobalBuffer.from(bytes.buffer);
						} else {
							console.error("GitHub Autocomplete: Cannot decrypt without Buffer");
							return []; 
						}
					}
					
					 
					tokensJson = safeStorage.decryptString(buffer) as string;
				} else {
					console.warn("GitHub Autocomplete: Token is encrypted but safeStorage is not available.");
					return [];
				}
			}

			const parsedTokens = JSON.parse(tokensJson);
			if (Array.isArray(parsedTokens)) {
				window.localStorage.removeItem(legacyKey); // Clean up legacy
				return parsedTokens as GitHubToken[];
			}
		} catch (e) {
			console.error("GitHub Autocomplete: Error loading v2 legacy tokens", e);
		}
		return [];
	}

	private migrateFromV1(): GitHubToken[] {
		const legacyKey = this.getLegacyV1StorageKey();
		const dataStr = window.localStorage.getItem(legacyKey);
		if (!dataStr) return [];

		try {
			 
			const data = JSON.parse(dataStr);
			 
			let tokenStr = data.value as string;
			 
			if (data.encrypted) {
				const safeStorage = this.getElectronSafeStorage();
				 
				if (safeStorage && safeStorage.isEncryptionAvailable()) {
					let buffer;
					 
					if (typeof (globalThis as any).Buffer !== 'undefined') {
						 
						buffer = (globalThis as any).Buffer.from(tokenStr, 'base64');
					} else {
						const binary_string = window.atob(tokenStr);
						const len = binary_string.length;
						const bytes = new Uint8Array(len);
						for (let i = 0; i < len; i++) {
							bytes[i] = binary_string.charCodeAt(i);
						}
						 
						const GlobalBuffer = (globalThis as any).Buffer;
						if (GlobalBuffer) {
							 
							buffer = GlobalBuffer.from(bytes.buffer);
						} else {
							return []; 
						}
					}
					 
					tokenStr = safeStorage.decryptString(buffer) as string;
				} else {
					return [];
				}
			}

			if (tokenStr) {
				window.localStorage.removeItem(legacyKey); // Clean up legacy
				return [{
					id: Date.now().toString(),
					name: 'Default Token',
					token: tokenStr
				}];
			}
		} catch (e) {
			console.error("GitHub Autocomplete: Failed to migrate v1 token", e);
		}
		return [];
	}

	// Helper for v0 unencrypted token migration from settings
	migratePlaintextToken(plaintextToken: string): void {
		const tokens = this.loadTokens();
		tokens.push({
			id: Date.now().toString(),
			name: 'Migrated Token',
			token: plaintextToken
		});
		this.saveTokens(tokens);
	}
}
