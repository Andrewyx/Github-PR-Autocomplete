export interface GitHubIssue {
	number: number;
	title: string;
	html_url: string;
}

export interface GitHubPluginSettings {
	repo: string;
	triggerString: string;
}

export const DEFAULT_SETTINGS: GitHubPluginSettings = {
	repo: 'UBC-Thunderbots/Software',
	triggerString: '@'
}
