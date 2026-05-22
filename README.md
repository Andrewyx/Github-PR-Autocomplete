# GitHub PR Autocomplete

This plugin for [Obsidian](https://obsidian.md) provides an autocomplete suggester for GitHub issues and pull requests from within the editor. When you type a trigger character (default is `@`), it fetches open issues and PRs from your configured GitHub repository and allows you to insert links to them directly into your notes.

## Features

- **GitHub Issue/PR Autocomplete**: Trigger a searchable list of open issues and PRs.
- **Support for Private Repositories**: Link your GitHub Personal Access Token (PAT) to access private repos.
- **Secure Token Storage**: Your GitHub tokens are stored securely using Obsidian's native `SecretStorage` API (hardware-encrypted on desktop via Keychain/DPAPI, and stored locally on mobile).
- **Multiple Tokens**: Manage multiple named tokens and see their validity status (with color indicators) in the settings.
- **Customizable Trigger**: Change the trigger character from `@` to anything else (e.g., `gh#`) to avoid conflicts with other plugins.

## How to use

1.  **Configure Repository**: In the plugin settings, enter your GitHub repository in the format `owner/repo` (e.g., `UBC-Thunderbots/Software`).
2.  **Add Token (Optional but Recommended)**: 
    *   Create a [GitHub Personal Access Token](https://github.com/settings/tokens) (classic) with `repo` scope.
    *   In the plugin settings, add a new token with a name (e.g., "Work") and the token value.
    *   The plugin will verify the token and show a green "Valid token saved" indicator if successful.
3.  **Type to Link**: In any markdown file, type `@` followed by a search term or issue number. Select an item from the list to insert a markdown link.

## License

MIT

Finally, thanks to https://github.com/kemayo/obsidian-smart-links for inspiring this project!
