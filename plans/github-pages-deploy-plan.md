# Plan: Deploy Resistance Assistant to GitHub Pages

## Goal
Publish the static SPA (Vite build) from /workspace/resistance-assistant to GitHub Pages at https://<user>.github.io/resistance-assistant/.

## Decisions
- Provider: GitHub Pages (free tier; public repo required - agreed with user).
- Repo: `resistance-assistant`, public, created by the worker via the GitHub API.
- Token: classic PAT at /run/secrets/gh_token on the worker host; scopes verified as `repo, workflow, read:packages` (sufficient for repo creation, workflow push, Pages enablement). Read at runtime; never echoed, committed, or persisted in .git/config. User revokes it after deployment is confirmed.
- Deploy method: official Pages Actions workflow triggered on push to main; worker enables Pages via API (build_type: workflow) before the first push.
- Vite base: '/resistance-assistant/' (project-page subpath).

## Tasks (ordered; report every command's output verbatim)
1. Derive username: `curl -H "Authorization: Bearer $TOKEN" https://api.github.com/user`; extract login with grep pattern '"login": *"[^"]*"' (GitHub JSON has a space after the colon). Abort with report on 401/403.
2. vite.config.ts: set `base: '/resistance-assistant/'`; run `npm run build` to confirm.
3. Add .github/workflows/deploy.yml: `on: push` to main + workflow_dispatch; permissions: contents: read, pages: write, id-token: write; concurrency group "pages"; steps: actions/checkout@v4, actions/setup-node@v4 (node 20, cache npm), npm ci, npm run build, actions/configure-pages@v5, actions/upload-pages-artifact@v3 (path: dist), actions/deploy-pages@v4.
4. Create repo: POST /user/repos {"name":"resistance-assistant","private":false}. On 422 (already exists): if the existing repo is empty, proceed to push; else stop and report.
5. Enable Pages: POST /repos/{owner}/{repo}/pages {"build_type":"workflow"}. A 409 (already enabled) is OK.
6. Push: add remote origin WITHOUT credentials; push main using a one-shot token URL (TOKEN read from /run/secrets/gh_token, never echoed into logs).
7. Monitor the Actions run via GET /repos/{owner}/{repo}/actions/runs until completion. On failure: fetch run logs via API, fix (most likely base path or Node version), commit and re-push. Rollback path: git revert + push redeploys.
8. Validate: `curl -sI https://<user>.github.io/resistance-assistant/` returns 200; curl the page HTML and one JS asset; confirm "Resistance Assistant" markup.
9. Report username, repo URL, Pages URL, Actions run status; remind the user to revoke the token.

## Risks
- First Actions run failure (environment/build) - mitigated by log-driven fixes and re-push.
- Token leakage - mitigated by runtime read, no echo/persist, post-deploy revocation.
- API rate limits - token-authenticated (5000/hr), ample.

## Validation
Actions run green; Pages URL returns 200 serving the app; all command outputs reported verbatim.

## Out of scope
Custom domain; server-side SPA routing config (single page, no routes); CI on non-main branches.
