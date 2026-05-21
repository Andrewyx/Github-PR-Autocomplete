import { App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo } from 'obsidian';
import type { GitHubIssue } from './types';
import type GitHubAutocompletePlugin from './main';

export class IssueSuggester extends EditorSuggest<GitHubIssue> {
	plugin: GitHubAutocompletePlugin;

	constructor(app: App, plugin: GitHubAutocompletePlugin) {
		super(app);
		this.plugin = plugin;
	}

	/**
	 * Detects if the user typed '#' preceded by a space, start of line, or common punctuation.
	 * Improved to allow alphanumeric characters after # for title searching.
	 */
	onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line);
		const sub = line.substring(0, cursor.ch);
		
		const triggerStr = this.plugin.settings.triggerString;
		
		// Ensure triggerStr is valid to prevent infinite loops or errors
		if (!triggerStr) return null;

		// Scan backwards to find the trigger string
		let triggerIndex = -1;
		
		for (let i = sub.length; i >= triggerStr.length; i--) {
			const candidate = sub.substring(i - triggerStr.length, i);
			if (candidate === triggerStr) {
				triggerIndex = i - triggerStr.length;
				break;
			}
			// If we hit a space before finding a trigger, we stop looking.
			if (sub.charAt(i - 1) === ' ') {
				break;
			}
		}

		if (triggerIndex !== -1) {
			const query = sub.substring(triggerIndex + triggerStr.length);
			const charBefore: string = triggerIndex > 0 ? sub.charAt(triggerIndex - 1) : '';
			
			// Valid if at start of line, or preceded by space, or common punctuation
			if (charBefore === '' || charBefore === ' ' || charBefore === '(' || charBefore === '[' || charBefore === '{') {
				const startPos = { line: cursor.line, ch: triggerIndex };
				return {
					start: startPos,
					end: cursor,
					query: query
				};
			}
		}

		return null;
	}

	/**
	 * Filters the cached issues based on the query (number or title).
	 */
	getSuggestions(context: EditorSuggestContext): GitHubIssue[] {
		const query = context.query.toLowerCase();
		const cache = this.plugin.issuesCache;
		
		let suggestions: GitHubIssue[] = [];
		if (!query) {
			suggestions = cache.slice(0, 10);
		} else {
			suggestions = cache.filter(issue =>
				issue.number.toString().includes(query) || 
				issue.title.toLowerCase().includes(query)
			).slice(0, 10);
		}

		return suggestions;
	}

	/**
	 * Renders each item in the dropdown.
	 */
	renderSuggestion(issue: GitHubIssue, el: HTMLElement): void {
		el.createEl('div', { 
			text: `#${issue.number}`, 
			cls: 'github-issue-number', 
			attr: { style: 'font-weight: bold; color: var(--text-accent); display: inline-block; width: 60px;'} 
		});
		el.createEl('span', { text: issue.title, cls: 'github-issue-title' });
	}

	/**
	 * Replaces the query with a Markdown link when selected.
	 */
	selectSuggestion(issue: GitHubIssue, evt: MouseEvent | KeyboardEvent): void {
		if (this.context) {
			const editor = this.context.editor;
			const replacement = `[#${issue.number}](${issue.html_url}) `;
			editor.replaceRange(replacement, this.context.start, this.context.end);
		}
	}
}
