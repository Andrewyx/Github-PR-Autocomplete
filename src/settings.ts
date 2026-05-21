import { App, PluginSettingTab, Setting, requestUrl } from 'obsidian';
import type GitHubAutocompletePlugin from './main';
import { TokenManager, GitHubToken } from './security';

export class GitHubPluginSettingTab extends PluginSettingTab {
	plugin: GitHubAutocompletePlugin;
	tokens: GitHubToken[] = [];
	newTokenName: string = '';
	newTokenValue: string = '';

	constructor(app: App, plugin: GitHubAutocompletePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		
		this.tokens = TokenManager.loadTokens(this.app.vault.getName());

		new Setting(containerEl)
			.setName('GitHub repository')
			.setDesc('Format: owner/repo')
			.addText(text => text
				.setPlaceholder('Owner/repo')
				.setValue(this.plugin.settings.repo)
				.onChange(async (value) => {
					this.plugin.settings.repo = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Trigger string')
			.setDesc('The character or string that triggers the autocompletion (e.g. @ or gh#). Note: using just "#" may conflict with Obsidian\'s built-in tag suggester.')
			.addText(text => text
				.setPlaceholder('@')
				.setValue(this.plugin.settings.triggerString)
				.onChange(async (value) => {
					this.plugin.settings.triggerString = value || '@'; // Fallback to @ if empty
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Personal access tokens')
			.setDesc('Add your GitHub personal access tokens here. They are securely encrypted on your desktop.')
			.setHeading();

		// Render existing tokens
		for (const token of this.tokens) {
			const setting = new Setting(containerEl)
				.setName(token.name)
				.setDesc('Checking validity...')
				.addButton(btn => btn
					.setButtonText('Delete')
					.setWarning()
					.onClick(() => {
						this.tokens = this.tokens.filter(t => t.id !== token.id);
						TokenManager.saveTokens(this.app.vault.getName(), this.tokens);
						this.display();
						void this.plugin.fetchIssues();
					}));
			
			// Verify token asynchronously and update description
			void this.verifyToken(token.token).then(isValid => {
				const desc = document.createDocumentFragment();
				const span = desc.createSpan();
				if (isValid) {
					span.setText('Valid token saved');
					span.addClass('github-token-valid');
				} else {
					span.setText('Invalid token');
					span.addClass('github-token-invalid');
				}
				setting.setDesc(desc);
			});
		}

		// Add new token section
		const newSetting = new Setting(containerEl)
			.setName('Add new token')
			.setDesc('Provide a name and the token value.');

		newSetting.addText(text => text
			.setPlaceholder('Token name (e.g. Work)')
			.onChange(value => {
				this.newTokenName = value;
			}));

		newSetting.addText(text => {
			text.inputEl.type = 'password';
			text.setPlaceholder('Token value')
				.onChange(value => {
					this.newTokenValue = value;
				});
		});

		newSetting.addButton(btn => btn
			.setButtonText('Add')
			.setCta()
			.onClick(() => {
				if (this.newTokenName && this.newTokenValue) {
					this.tokens.push({
						id: Date.now().toString(),
						name: this.newTokenName,
						token: this.newTokenValue
					});
					TokenManager.saveTokens(this.app.vault.getName(), this.tokens);
					this.newTokenName = '';
					this.newTokenValue = '';
					this.display();
					void this.plugin.fetchIssues();
				}
			}));
	}

	private async verifyToken(token: string): Promise<boolean> {
		try {
			const response = await requestUrl({
				url: 'https://api.github.com/user',
				method: 'GET',
				headers: {
					'Accept': 'application/vnd.github.v3+json',
					'X-GitHub-Api-Version': '2022-11-28',
					'Authorization': `Bearer ${token}`
				}
			});
			return response.status === 200;
		} catch {
			return false;
		}
	}
}
