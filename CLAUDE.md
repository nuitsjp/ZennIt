# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Project Overview

ZennIt is a toolchain for summarizing Chat AI conversations and publishing them to Zenn. It consists of:
- **Chrome Extension**: Summarizes conversations from ChatGPT/Claude/Gemini/GitHub Copilot/Microsoft Copilot and publishes to GitHub
- **Azure Functions**: OAuth token exchange service (GitHub OAuth Apps → access token)
- Published articles are stored in `articles/` directory and Zenn monitors the GitHub repository via webhooks

## Build Commands

### Chrome Extension
```bash
cd chrome-extension
npm install
npm run build    # Production build to dist/
npm run dev      # Development build with source maps
```

### Azure Functions
```bash
cd azure-functions/src/ZennIt
dotnet build
func start       # Requires local.settings.json with GitHubClientId, GitHubClientSecret, AccessControlAllowOrigin
```

## Testing and Deployment

### Chrome Extension Testing
Load `chrome-extension/dist/` as an unpacked extension in Chrome/Edge after building.

### Release Process
- Tag with `v*.*.*` triggers GitHub Actions workflow (.github/workflows/release-chrome-extension.yml)
- Workflow updates manifest.json version, builds, creates ZIP, and creates GitHub Release
- Manual upload to Chrome Web Store required (ZIP file attached to release)

### Azure Functions Deployment
- Automatic deployment on push to main when `azure-functions/src/**` changes (.github/workflows/func-zennit-prod-japaneast.yml)
- Uses Azure Workload Identity Federation (OIDC)
- Function app name: `func-zennit-prod-japaneast`

## Architecture

### Chrome Extension Structure

**Key Configuration Files:**
- `src/js/constants.js`: `SERVICES` object maps service IDs to URL patterns and input selectors; `STORAGE_KEYS` defines chrome.storage keys
- `src/assets/json/config.json`: GitHub OAuth CLIENT_ID, FUNCTION_URL, API endpoints (not gitignored - contains public client ID)
- `src/assets/prompt/*.txt`: Default prompts for each service (chatgpt.txt, claude.txt, gemini.txt, githubcopilot.txt, mscopilot.txt)

**Core Services:**
- `github-service.js`: GitHub OAuth flow via chrome.identity + Azure Functions, file operations using @octokit/rest
  - `authenticate()`: Gets GitHub access token (cached in chrome.storage.sync)
  - `createOrUpdateFileContents()`: Commits to `articles/{filename}` (handles new/update)
  - OAuth flow: chrome.identity.launchWebAuthFlow → Azure Functions → GitHub token exchange
- `prompt-service.js`: Centralized prompt loading from assets or chrome.storage.sync
- `storage-service.js`: Wrapper for chrome.storage operations
- `google-analytics.js`: GA4 Measurement Protocol integration for error/event tracking

**UI Components:**
- `popup/`: Main extension popup (Summary/Publish/Settings buttons, enabled only on supported services)
- `options/`: Settings page (GitHub repository, custom prompts per service)
- `publish/`: Article publishing page (clipboard auto-read, front matter detection, GitHub commit)

**Content Script:**
- `content.js`: Injected into supported service pages, handles `generateSummary` message by detecting input field, inserting prompt, and sending Enter key

**Service Worker:**
- `service-worker.js`: Initializes default settings on install, handles uncaught exceptions

**Build Process (webpack.config.js):**
- Dynamically creates entry points from all `src/**/*.js` files
- Outputs to `dist/` as `[name].bundle.js` maintaining directory structure
- CopyPlugin copies HTML/CSS/assets/manifest.json to dist/
- Production mode: minified without source maps; Development mode: source maps enabled

### Azure Functions Backend

**Project:** `azure-functions/src/ZennIt` (.NET 8 Isolated Functions)

**Key Files:**
- `ExchangeGitHubToken.cs`: HTTP trigger function (GET/POST, Anonymous)
  - Accepts `code` query parameter (GitHub OAuth code)
  - `code=heartbeat` returns health check response
  - Exchanges code for access_token via GitHub OAuth Apps API
  - Returns plain text `access_token=xxx` (URL-encoded format)
- `CorsMiddleware.cs`: Adds CORS headers to all responses (`Access-Control-Allow-*`)
- `Program.cs`: Configures ASP.NET Core integration and CORS origins

**Required Environment Variables:**
- `GitHubClientId`: GitHub OAuth App Client ID
- `GitHubClientSecret`: GitHub OAuth App Client Secret
- `AccessControlAllowOrigin`: Extension origin (e.g., `chrome-extension://mlhbhgjbdbgealohaocdehgkopefkndd`)

**CORS Configuration:**
- `AccessControlAllowOrigin` environment variable sets allowed origin
- `Program.cs` hardcodes extension ID - **must update for custom deployments**

### Service Detection and Adding New Services

**Current Services (SERVICES object in constants.js):**
- `chatgpt`: `#prompt-textarea` on chatgpt.com
- `claude`: `div[contenteditable="true"]` on claude.ai
- `gemini`: `input-area-v2 .ql-editor[role="textbox"]` on gemini.google.com
- `githubcopilot`: `#copilot-chat-textarea` on github.com
- `mscopilot`: `#m365-chat-editor-target-element` on copilot.cloud.microsoft, m365.cloud.microsoft

**To Add New Service:**
1. Add entry to `SERVICES` in `src/js/constants.js` with service ID, hostname pattern, input selector
2. Create `src/assets/prompt/{serviceId}.txt` with default prompt
3. Update `manifest.json`:
   - Add URL patterns to `content_scripts[].matches`
   - Add URL patterns to `web_accessible_resources[].matches`
4. Build and test

### OAuth Flow Details

1. User clicks "Publish" → GitHub OAuth initiated if no cached token
2. `chrome.identity.getRedirectURL("github")` generates redirect URL (format: `https://<extension-id>.chromiumapp.org/github`)
3. `chrome.identity.launchWebAuthFlow` opens GitHub authorize page with scope `repo`
4. GitHub redirects with `code` parameter
5. Extension sends code to Azure Functions endpoint
6. Functions exchanges code for access_token using client_secret (not exposed to extension)
7. Extension caches access_token in chrome.storage.sync

**GitHub OAuth Apps Configuration:**
- Authorization callback URL must be `https://<extension-id>.chromiumapp.org/github`
- Scope: `repo` (for private repository access)

### Storage Strategy

**chrome.storage.sync:**
- `repository`: GitHub repository (owner/repo format)
- `github_token`: Cached GitHub access token
- `{serviceId}_prompt`: Custom prompts per service (e.g., `chatgpt_prompt`)

**chrome.storage.local:**
- Google Analytics client ID

**chrome.storage.session:**
- GA session information (30-minute expiry)

### File Publishing Flow

1. User opens Publish page → clipboard auto-read
2. Clipboard parsing logic:
   - If starts with ````text`: Remove first and last lines
   - If starts with `---` (front matter): Use full content as body, empty title
   - Otherwise: First line = title, rest = body
3. File path: Always `articles/{user-input-filename}`
4. Commit message: `Publish: articles/{filename}`
5. GitHub API checks file existence via directory listing (avoids 404 logs)
6. If exists: Confirm dialog → update file; If new: Create file
7. Content encoded as UTF-8 → Base64 for GitHub API

### Google Analytics Integration

- Uses GA4 Measurement Protocol (direct HTTP calls, no gtag.js)
- Events: `extension_error`, `page_view`, `click_button`
- Client ID persisted in chrome.storage.local
- Session management in chrome.storage.session with 30-minute auto-extension
- Error tracking: Uncaught exceptions sent to GA via service worker

## Important Development Notes

### When Modifying OAuth Flow
- Never expose GitHub client_secret in extension code - always proxy through Azure Functions
- Update both `config.json` CLIENT_ID and Azure Functions environment variables
- Update `Program.cs` CORS origin when deploying custom Functions instance

### When Adding Services
- Input field detection uses polling (500ms interval) - selector must be stable after page load
- Test both contenteditable (Claude) and textarea (ChatGPT) input types
- Prompt insertion uses InputEvent + KeyboardEvent for compatibility

### Webpack Configuration
- All JS files in `src/` automatically become entry points (no manual registration needed)
- Output maintains directory structure: `src/js/foo.js` → `dist/js/foo.bundle.js`
- Static assets copied verbatim by CopyPlugin - changes to HTML/CSS don't require webpack entry changes

### Chrome Storage Limits
- chrome.storage.sync: 100KB total, 8KB per item - prompts must be reasonably sized
- Token caching persists across extension restarts but clears on uninstall

### Deployment Coordination
- Extension `config.json` FUNCTION_URL must match deployed Azure Functions URL
- Azure Functions `AccessControlAllowOrigin` must match installed extension ID
- For custom deployments: Update both simultaneously to avoid CORS errors
