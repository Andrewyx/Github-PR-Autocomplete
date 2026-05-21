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

	saveTokens(tokens: GitHubToken[]): void {
		const tokensJson = JSON.stringify(tokens);
		if (this.app.secretStorage) {
			this.app.secretStorage.setSecret(this.secretId, tokensJson);
		} else {
			console.error('GitHub Autocomplete: SecretStorage API is missing.');
		}
	}

	loadTokens(): GitHubToken[] {
		if (this.app.secretStorage) {
			const secretStr = this.app.secretStorage.getSecret(this.secretId);
			if (secretStr) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const parsed = JSON.parse(secretStr);
					if (Array.isArray(parsed)) {
						return parsed as GitHubToken[];
					}
				} catch (e) {
					console.error("GitHub Autocomplete: Failed to parse tokens from SecretStorage", e);
				}
			}
		}

		return [];
	}
}
