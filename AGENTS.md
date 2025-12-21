# Repository Guidelines

## Core Mandates

**CRITICAL: You must adhere to these rules in all interactions.**

1.  **Language**:
    *   **Think in English.**
    *   **Interact with the user in Japanese.**
    *   Plans and artifacts (commit messages, PR descriptions) must be written in **Japanese**.
2.  **Test-Driven Development (TDD)**:
    *   Strictly adhere to the **t-wada style** of TDD.
    *   **RED-GREEN-REFACTOR** cycle must be followed without exception.
    *   Write a failing test first, then implement the minimal code to pass it, then refactor.

## Project Structure & Module Organization
This repo ships a Chrome/Edge extension plus an Azure Functions backend.

- `chrome-extension/` contains the extension: `src/` for JS/HTML/CSS, `src/assets/` for prompts and config, and `dist/` for build output.
- `azure-functions/src/ZennIt/` is the .NET 8 isolated Functions app (`ExchangeGitHubToken.cs`, `Program.cs`, `host.json`).
- `assets/` holds README images; `doc/Architecture.md` captures the OAuth flow.

## Build, Test, and Development Commands
Run commands from the appropriate subdirectory.

- Extension build: `cd chrome-extension` then `npm install`, `npm run build` (production bundle to `dist/`).
- Extension dev build: `npm run dev` (development bundle with source maps).
- Helper script: `chrome-extension/Build-Extension.ps1` runs the production build.
- Functions build: `cd azure-functions/src/ZennIt` then `dotnet build`.
- Functions local run: `func start` (requires Azure Functions Core Tools and `local.settings.json`).

## Coding Style & Naming Conventions
- JavaScript uses 2-space indentation, semicolons, and ES module imports.
- JS filenames are kebab-case (example: `prompt-service.js`).
- Constants are `UPPER_SNAKE_CASE` and service IDs are lowercase, matching prompt files in `chrome-extension/src/assets/prompt/<id>.txt`.
- C# follows standard .NET formatting with top-level statements in `Program.cs`.
- No repo-wide linter or formatter is enforced; mirror the existing style in the file you touch.

## Testing Guidelines
There is no automated test suite in this repo.

- Smoke-test the extension by loading `chrome-extension/dist` as an unpacked extension and running “Summary” and “Publish”.
- Smoke-test the backend with `func start`, then call `ExchangeGitHubToken?code=heartbeat`.

## Commit & Pull Request Guidelines
- Commit history uses short, descriptive sentences (often Japanese) without conventional prefixes. Keep messages concise and change-focused.
- PRs should explain intent, link relevant issues, and include test steps. Add screenshots/gifs for UI changes in the extension.

## Configuration & Security Notes
- Never commit secrets. Configure `GitHubClientId`, `GitHubClientSecret`, and `AccessControlAllowOrigin` via app settings or `local.settings.json`.
- Keep `chrome-extension/src/assets/json/config.json` aligned with deployed OAuth client ID and Functions URL.
- Ensure CORS origins in `Program.cs` match the extension ID you ship.
