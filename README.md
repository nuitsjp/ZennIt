# Zenn It!
Chat AIとの対話ログをワンクリックで要約し、ローカルでgitを扱わずにZennへ公開するためのツールチェーンです。Chrome/Edge 拡張で記事を作り、Azure Functions経由でGitHub OAuthトークンを取得してリポジトリへpushします。実装を失っても本書から再構築できるよう、目的・仕様・設計・セットアップ手順を詳細にまとめています。

## このリポジトリーで解決すること
- ChatGPT/Claude/Gemini/GitHub Copilot/Microsoft Copilot上の長い対話を、統一プロンプトで要約する自動入力。
- 要約結果をコピーしてそのまま記事化し、GitHubリポジトリ（Zennが監視）へ直接コミット。
- GitHub OAuthのクライアントシークレットを拡張内に置かず、Azure Functionsを仲介して安全にトークン交換。

## システム概要（概念設計）
- コンポーネント: Chrome拡張（UI・要約自動入力・GitHub連携）/ Azure Functions（OAuthコード→アクセストークン交換）/ GitHubリポジトリ（`articles/`以下に記事保存）/ Zenn（Webhookで公開）。
- フロー:
  1. ユーザーが対象サービスのタブを開き、拡張ポップアップで「要約」を押下。
  2. コンテンツスクリプトがサービス別の入力欄を検出し、プリセットプロンプトを自動入力して送信（Enter）。
  3. 生成された要約をユーザーがコピーし、「発行」からPublishページを開く。
  4. Publishページがクリップボードを読み取り、タイトル/本文を自動プリセット（フロントマター有無を判定）。
  5. GitHub OAuth（chrome.identity → Azure Functions → GitHub OAuth Apps）でアクセストークンを取得・キャッシュ。
  6. `articles/{入力ファイル名}` へコミット（新規 or 既存ファイル更新を確認）。
  7. GitHub更新をZennがWebhookで検知し、記事を公開。

## リポジトリー構成
- `chrome-extension/` … 拡張本体。`src/` がソース、`dist/` がビルド成果物。webpackでバンドル。
- `azure-functions/` … GitHub OAuthコードをアクセストークンへ交換する .NET 8 Isolated Functions。
- `assets/` … README用スクリーンショット/アニメーション。
- `doc/Architecture.md` … OAuth連携の簡易アーキテクチャ（本READMEに統合済み）。

## Chrome拡張の仕様
### 対応サービスと入力検出
- サービス判定はURLで実施し、入力欄セレクタは `chrome-extension/src/js/constants.js` の `SERVICES` に集約。
  - ChatGPT: `#prompt-textarea`
  - Claude: `div[contenteditable="true"]`
  - Gemini: `input-area-v2 .ql-editor[role="textbox"]`
  - GitHub Copilot: `#copilot-chat-textarea`
  - Microsoft Copilot: `#m365-chat-editor-target-element`
- 新規サービス追加は `SERVICES` にID/セレクタを追加し、同名のプロンプトファイルを `src/assets/prompt/{id}.txt` に置き、`manifest.json` の `matches`/`web_accessible_resources` を拡張。

### プロンプト管理
- デフォルトプロンプトは `src/assets/prompt/*.txt` に5種（chatgpt/claude/gemini/githubcopilot/microsoftcopilot）。
- `prompt-service.js` の `getPrompt(serviceName, forceReload=false)` が単一の取得ポイント。
  - `chrome.storage.sync` にキャッシュがあればそれを返却。
  - ない場合 `chrome.runtime.getURL` で assets をfetchし、同期ストレージへキャッシュ。
  - オプション画面で編集した内容も同キーで上書き保存される。

### UIと挙動
- **ポップアップ (`src/popup`)**
  - ボタン: 「要約」「発行」「設定」。
  - `allowedUrls` に含まれるホスト（上記5サービス）でのみボタン有効化。
  - 要約: アクティブタブへ `{action: "generateSummary"}` を送信。コンテンツスクリプト側で入力→Enter送信。
  - 発行: リポジトリ未設定ならオプションを開き、設定済みなら Publish ページを新タブで開く。
- **オプション (`src/options`)**
  - 入力: GitHubリポジトリ（`owner/repo` 形式）、各サービスのプロンプト。
  - 全フィールド必須。空欄はバリデーションで保存不可。
  - 保存先は `chrome.storage.sync`。初回インストール時、リポジトリは空文字で初期化。
- **Publishページ (`src/publish`)**
  - 画面表示時にクリップボードからテキストを読み取り:
    - 先頭行が ````text` の場合は最初と末尾の行を除去。
    - 先頭行が `---`（Markdown Front Matter）なら全文を本文とみなし、タイトルは空。
    - それ以外は1行目をタイトル、2行目以降を本文に自動挿入。
  - ファイルパスは常に `articles/{入力タイトル}`。コミットメッセージは `Publish: articles/xxx`。
  - 既存ファイルだった場合は confirm ダイアログで上書き可否を問い、OKなら `updateFile`。
  - エラー時は画面内の赤枠エリアに詳細を表示。

### GitHub連携（`src/js/github-service.js`）
- 設定読込: `assets/json/config.json` から OAuthクライアントID・Functions URL・GitHub APIエンドポイントを取得。
- 認証フロー:
  1. `chrome.identity.getRedirectURL("github")` で拡張用リダイレクトURLを取得。
  2. `chrome.identity.launchWebAuthFlow` で GitHub OAuth Apps へ認可リクエスト（scope: `repo`）。
  3. リダイレクトURLに付与された `code` を Azure Functions へ送信（`FUNCTION_URL?code={code}`）。
  4. Functions が `client_id`/`client_secret` を付与して GitHub にトークン交換を実行し、結果を返却。
  5. `access_token` を `chrome.storage.sync` にキャッシュ（`STORAGE_KEYS.TOKEN`）。
- ファイル操作:
  - Octokit（REST v3, `@octokit/rest`）で `createOrUpdateFileContents` を使用。本文は UTF-8→Base64。
  - 新規作成に失敗し `422` が返った場合は「既存あり」とみなし、更新フローへ移行。
  - `checkFileExistence` はディレクトリリスト取得で存在確認し、不要な404ログを減らす実装。

### コンテンツスクリプト（`src/js/content.js`）
- `chrome.runtime.onMessage` で `generateSummary` を受け、サービス判定→入力欄待機（500ms間隔）→プロンプト入力（InputEvent）→Enter送信（KeyboardEvent）を行う。
- 入力欄が見つかるまでポーリングし、テキストエリア/コンテンツエディタ両対応で textContent/value を更新。

### バックグラウンド/解析
- サービスワーカー (`src/js/service-worker.js`) はインストール時にデフォルト設定を初期化し、未捕捉例外を Google Analytics へ送信。
- GA計測: `src/js/google-analytics.js` が GA4 Measurement Protocol を直接呼び出し、`extension_error`/`page_view`/`click_button` 等を送信。クライアントIDは `chrome.storage.local` に保存、セッションは `chrome.storage.session` で30分延命。

### マニフェスト/パーミッション
- `manifest_version`: 3。権限: `identity`, `storage`, `clipboardRead`, `activeTab`。
- `host_permissions`: Functionsエンドポイント、GitHub、Copilotドメイン。
- `web_accessible_resources`: プロンプトTXT/設定JSON/`js/constants.bundle.js` を対象サービスのホストに限定公開。

### ビルドと配布
- 依存: Node.js（webpack 5系, Babel）, Octokit。
- `npm install` → `npm run build` で `dist/` に以下を出力: バンドル済みJS、コピーされたHTML/CSS/アセット、`manifest.json`。
- `webpack.config.js` は `src/**/*.js` を動的に全エントリー化し、`CopyPlugin` で静的資産を複製。`--mode development` でsource map付き出力。
- 配布: `dist/` を「パッケージ化されていない拡張機能として読み込む」か、Chrome Web Store へアップロード（`manifest.json` の `version` を更新）。

## Azure Functions バックエンドの仕様
- プロジェクト: `azure-functions/src/ZennIt`（.NET 8 Isolated）。`Microsoft.Azure.Functions.Worker` 系を利用。
- エンドポイント: `ExchangeGitHubToken`（HTTP Trigger, Anonymous, GET/POST）。
  - クエリ `code` が必須。`code=heartbeat` の場合は稼働確認として `"I'm awake!"` を返す。
  - `code` を GitHub OAuth Apps に送り、`access_token` 文字列をそのまま HTTP 200 で返却（URLエンコード形式）。
- CORS: `CorsMiddleware` が毎レスポンスに `Access-Control-Allow-*` ヘッダーを付与。
  - `AccessControlAllowOrigin` は環境変数から取得（例: `chrome-extension://<extension-id>`）。
  - `Program.cs` でも `WithOrigins("chrome-extension://mlhbhgjbdbgealohaocdehgkopefkndd")` を追加しているため、独自デプロイ時は拡張IDに合わせて調整する。
- 必須環境変数（デプロイ先のアプリ設定/`local.settings.json`）
  - `GitHubClientId`: GitHub OAuth Apps の Client ID
  - `GitHubClientSecret`: 同 Client Secret
  - `AccessControlAllowOrigin`: 許可する拡張オリジン
- ビルド/デプロイ例（標準的な手順）
  - ローカル: Azure Functions Core Tools を用い `dotnet build` → `func start`（`local.settings.json` に上記環境変数を設定）。
  - Azure: `func azure functionapp publish <app-name>`。`FUNCTION_URL` と拡張側 `config.json` の `CLIENT_ID` を揃える。

## GitHub OAuth Apps 設定要点
- Authorization callback URL に `https://<extension-id>.chromiumapp.org/github` を登録（`chrome.identity.getRedirectURL("github")` が生成するURL）。
- Scope: `repo`（プライベートリポジトリに発行する場合も対応）。
- Azure Functions 側で同じ Client ID/Secret を保持し、拡張の `assets/json/config.json` に Client ID と Functions URL を記述する。

## データ永続化・設定
- `chrome.storage.sync`: `repository`, `github_token`, 各サービスID名のプロンプト。
- `chrome.storage.local`: Google Analytics 用 clientId。
- `chrome.storage.session`: GAセッション情報。
- GitHub: `articles/` ディレクトリ配下に Markdown を追加/更新。コミットメッセージは `Publish: articles/{filename}`。

## 再実装手順（最低限）
1) Chrome拡張
   - Node.js を用意し `chrome-extension/` で `npm install` → `npm run build`。
   - `dist/` を Chrome/Edge の「パッケージ化されていない拡張機能を読み込む」で登録。
   - `options` でリポジトリと各プロンプトを設定。必要に応じて `assets/json/config.json` の `CLIENT_ID`/`FUNCTION_URL` を自環境に変更。
2) Azure Functions
   - GitHub OAuth Apps を作成し Client ID/Secret を取得。
   - 上記を環境変数として設定し、Functions をデプロイ。`FUNCTION_URL` を拡張設定と一致させる。
3) GitHub/Zenn リポジトリ
   - Zennの推奨構成（`articles/xxxx.md`）で公開用リポジトリを用意し、Webhook で Zenn と連携（既存のZenn運用手順に従う）。

## トラブルシュートの観点
- OAuth 403/500: Functions が停止/シークレット不一致の可能性。`code=heartbeat` で稼働確認。
- CORS エラー: `AccessControlAllowOrigin` または `Program.cs` の許可オリジンが拡張IDと一致しているか確認。
- クリップボード読取不可: ブラウザの権限設定を確認。空文字の場合は手動で貼り付けても動作する。
- `articles/` 以外に書き込みたい場合: `publish.js` の `fileName` 組み立てロジックを変更。

## ライセンス
MIT License（`LICENSE` を参照）。
