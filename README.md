# GitHub PR Autocomplete

This plugin for [Obsidian](https://obsidian.md) provides an autocomplete suggester for GitHub issues and pull requests. When you type a trigger character (default is `@`), it fetches open issues and PRs from your configured GitHub repository and allows you to insert links to them directly into your notes.

## Features

- **GitHub Issue/PR Autocomplete**: Trigger a searchable list of open issues and PRs.
- **Support for Private Repositories**: Link your GitHub Personal Access Token (PAT) to access private repos.
- **Secure Token Storage**: Your GitHub tokens are stored securely using Obsidian's native `SecretStorage` API (hardware-encrypted on desktop via Keychain/DPAPI, and stored locally on mobile).
- **Multiple Tokens**: Manage multiple named tokens and see their validity status (with color indicators) in the settings.
- **Customizable Trigger**: Change the trigger character from `@` to anything else (e.g., `gh#`) to avoid conflicts with other plugins.
- **Cache Management**: Manually refresh the issue cache via an Obsidian command.

## How to use

1.  **Configure Repository**: In the plugin settings, enter your GitHub repository in the format `owner/repo` (e.g., `UBC-Thunderbots/Software`).
2.  **Add Token (Optional but Recommended)**: 
    *   Create a [GitHub Personal Access Token](https://github.com/settings/tokens) (classic) with `repo` scope.
    *   In the plugin settings, add a new token with a name (e.g., "Work") and the token value.
    *   The plugin will verify the token and show a green "Valid token saved" indicator if successful.
3.  **Type to Link**: In any markdown file, type `@` followed by a search term or issue number. Select an item from the list to insert a markdown link.

## Installation

### From Community Plugins
1.  Search for "GitHub PR Autocomplete" in Obsidian's Community Plugins browser.
2.  Install and Enable the plugin.

### Manual Installation
1.  Download the latest release ( `main.js`, `manifest.json`, `styles.css`) from the [GitHub Releases](https://github.com/your-username/github-pr-autocomplete/releases) page.
2.  Create a folder named `github-pr-autocomplete` in your vault's `.obsidian/plugins/` directory.
3.  Copy the downloaded files into that folder.
4.  Reload Obsidian and enable the plugin in settings.

## Development

- `npm i` to install dependencies.
- `npm run dev` to start compilation in watch mode.
- `npm run build` to create a production build.
- `npm run lint` to check for code quality.

## Security

This plugin takes your security seriously:
- **No Plaintext Storage**: Tokens are never stored in the plugin's `data.json` or any other file in your vault.
- **No Cloud Sync**: Tokens are stored in a device-local area that is excluded from Obsidian Sync and Git backups.
- **Hardware Encryption**: On Desktop, tokens are encrypted using your OS-level keychain.

## License

MIT
