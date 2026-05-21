import { App, PluginSettingTab, Setting } from 'obsidian';
import type GitHubAutocompletePlugin from './main';

export class GitHubPluginSettingTab extends PluginSettingTab {
	plugin: GitHubAutocompletePlugin;

	constructor(app: App, plugin: GitHubAutocompletePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

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
			.setName('GitHub personal access token')
			.setDesc('Optional, but prevents API rate limiting and allows fetching from private repositories.')
			.addText(text => text
				.setPlaceholder('Your token')
				.setValue(this.plugin.settings.githubToken)
				.onChange(async (value) => {
					this.plugin.settings.githubToken = value;
					await this.plugin.saveSettings();
				}));
	}
}
