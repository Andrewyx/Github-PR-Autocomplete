import { Plugin, requestUrl } from 'obsidian';
import { GitHubPluginSettingTab } from './settings';
import { IssueSuggester } from './suggester';
import { DEFAULT_SETTINGS, GitHubIssue, GitHubPluginSettings } from './types';

export default class GitHubAutocompletePlugin extends Plugin {
	settings: GitHubPluginSettings;
	issuesCache: GitHubIssue[] = [];

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new GitHubPluginSettingTab(this.app, this));

		// Register the autocomplete suggester
		this.registerEditorSuggest(new IssueSuggester(this.app, this));

		// Command to manually refresh the issue cache
		this.addCommand({
			id: 'refresh-github-issues',
			name: 'Refresh GitHub issues cache',
			callback: () => { void this.fetchIssues(); }
		});

		// Fetch issues on load
		void this.fetchIssues();
	}

	/**
	 * Fetches open issues and PRs from the configured GitHub repository.
	 * Uses pagination to fetch up to 300 items to ensure older issues are included.
	 */
	async fetchIssues() {
		const repo = this.settings.repo;
		if (!repo) return;

		console.debug(`GitHub Autocomplete: Fetching issues for ${repo}...`);
		
		let allIssues: GitHubIssue[] = [];
		const maxPages = 3;
		const perPage = 100;

		try {
			for (let page = 1; page <= maxPages; page++) {
				const url = `https://api.github.com/repos/${repo}/issues?state=open&per_page=${perPage}&page=${page}`;
				const headers: Record<string, string> = {
					'Accept': 'application/vnd.github.v3+json',
					'X-GitHub-Api-Version': '2022-11-28'
				};

				if (this.settings.githubToken) {
					// Prefer Bearer for modern tokens, but GitHub still supports 'token' for classic ones.
					// Bearer is generally safer for both types.
					headers['Authorization'] = `Bearer ${this.settings.githubToken}`;
				}

				const response = await requestUrl({
					url,
					method: 'GET',
					headers
				});

				if (response.status === 200) {
					const issues = response.json as GitHubIssue[];
					allIssues = allIssues.concat(issues);
					
					// If we got fewer than perPage items, we've reached the last page
					if (issues.length < perPage) break;
				} else {
					console.error(`GitHub Autocomplete: Failed to fetch issues (Page ${page})`, response.status, response.text);
					break; 
				}
			}

			this.issuesCache = allIssues;
			console.debug(`GitHub Autocomplete: Cached ${this.issuesCache.length} issues.`);
		} catch (e) {
			console.error("GitHub Autocomplete: Network error while fetching issues", e);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<GitHubPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		void this.fetchIssues(); // Refresh cache when settings change
	}
}