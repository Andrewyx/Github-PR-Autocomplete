export interface GitHubIssue {
	number: number;
	title: string;
	html_url: string;
}

export interface GitHubPluginSettings {
	githubToken: string;
	repo: string;
	triggerString: string;
}

export const DEFAULT_SETTINGS: GitHubPluginSettings = {
	githubToken: '',
	repo: 'UBC-Thunderbots/Software',
	triggerString: '@'
}
