/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

export interface GitHubToken {
	id: string;
	name: string;
	token: string;
}

export class TokenManager {
	private static getStorageKey(vaultName: string): string {
		return `github-pr-autocomplete-${vaultName}-token-v2`;
	}

	private static getLegacyStorageKey(vaultName: string): string {
		return `github-pr-autocomplete-${vaultName}-token-v1`;
	}

	private static getSafeStorage() {
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
		} catch (e) {
			// Not on desktop or electron not available
		}
		return null;
	}

	static saveTokens(vaultName: string, tokens: GitHubToken[]): void {
		const safeStorage = this.getSafeStorage();
		const tokensJson = JSON.stringify(tokens);
		let storedValue = tokensJson;
		let isEncrypted = false;

		if (safeStorage && safeStorage.isEncryptionAvailable()) {
			try {
				const buffer = safeStorage.encryptString(tokensJson);
				storedValue = buffer.toString('base64');
				isEncrypted = true;
			} catch (e) {
				console.error("GitHub Autocomplete: Encryption failed", e);
			}
		}
		
		const dataToStore = JSON.stringify({
			value: storedValue,
			encrypted: isEncrypted
		});

		window.localStorage.setItem(this.getStorageKey(vaultName), dataToStore);
	}

	static loadTokens(vaultName: string): GitHubToken[] {
		const dataStr = window.localStorage.getItem(this.getStorageKey(vaultName));
		if (!dataStr) {
			// Try migrating from v1
			const legacyTokens = this.migrateFromV1(vaultName);
			if (legacyTokens.length > 0) {
				this.saveTokens(vaultName, legacyTokens);
			}
			return legacyTokens;
		}

		try {
			const data = JSON.parse(dataStr);
			let tokensJson = data.value as string;

			if (data.encrypted) {
				const safeStorage = this.getSafeStorage();
				if (safeStorage && safeStorage.isEncryptionAvailable()) {
					// We need to use Buffer to convert base64 back to buffer for decryption
					let buffer;
					if (typeof (globalThis as any).Buffer !== 'undefined') {
						buffer = (globalThis as any).Buffer.from(data.value as string, 'base64');
					} else {
						// Fallback if Buffer is somehow not available
						const binary_string = window.atob(data.value as string);
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
					
					tokensJson = safeStorage.decryptString(buffer);
				} else {
					console.warn("GitHub Autocomplete: Token is encrypted but safeStorage is not available.");
					return [];
				}
			}

			const parsedTokens = JSON.parse(tokensJson);
			if (Array.isArray(parsedTokens)) {
				return parsedTokens;
			}
			return [];
		} catch (e) {
			// Fallback if not valid JSON or other error
			console.error("GitHub Autocomplete: Error loading tokens", e);
			return [];
		}
	}

	private static migrateFromV1(vaultName: string): GitHubToken[] {
		const legacyKey = this.getLegacyStorageKey(vaultName);
		const dataStr = window.localStorage.getItem(legacyKey);
		if (!dataStr) return [];

		try {
			const data = JSON.parse(dataStr);
			let tokenStr = data.value as string;
			if (data.encrypted) {
				const safeStorage = this.getSafeStorage();
				if (safeStorage && safeStorage.isEncryptionAvailable()) {
					let buffer;
					if (typeof (globalThis as any).Buffer !== 'undefined') {
						buffer = (globalThis as any).Buffer.from(data.value as string, 'base64');
					} else {
						const binary_string = window.atob(data.value as string);
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
					tokenStr = safeStorage.decryptString(buffer);
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
	static migratePlaintextToken(vaultName: string, plaintextToken: string): void {
		const tokens = this.loadTokens(vaultName);
		tokens.push({
			id: Date.now().toString(),
			name: 'Migrated Token',
			token: plaintextToken
		});
		this.saveTokens(vaultName, tokens);
	}
}