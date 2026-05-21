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
			.setName('GitHub Repository')
			.setDesc('Format: owner/repo')
			.addText(text => text
				.setPlaceholder('UBC-Thunderbots/Software')
				.setValue(this.plugin.settings.repo)
				.onChange(async (value) => {
					this.plugin.settings.repo = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Trigger String')
			.setDesc('The character or string that triggers the autocompletion (e.g. @ or gh#). Note: Using just "#" may conflict with Obsidian\'s built-in tag suggester.')
			.addText(text => text
				.setPlaceholder('@')
				.setValue(this.plugin.settings.triggerString)
				.onChange(async (value) => {
					this.plugin.settings.triggerString = value || '@'; // Fallback to @ if empty
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('GitHub Personal Access Token')
			.setDesc('Optional, but prevents API rate limiting and allows fetching from private repositories.')
			.addText(text => text
				.setPlaceholder('ghp_...')
				.setValue(this.plugin.settings.githubToken)
				.onChange(async (value) => {
					this.plugin.settings.githubToken = value;
					await this.plugin.saveSettings();
				}));
	}
}
