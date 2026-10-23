# Confluence test results

The publisher adds an overview, local setup instructions, and a results table to an existing **published page**. It preserves content outside its marked results section and keeps the page title. After the first publication, edit the overview/setup directly in Confluence; only the managed results section is replaced. Finish any unpublished draft before the first publication.

## One-time setup

In GitHub, open **Settings → Secrets and variables → Actions** in `cesar-naja/saucedemo-playwright`.

Under **Secrets**, add:

- `CONFLUENCE_EMAIL`: the email for your Atlassian account.
- `CONFLUENCE_API_TOKEN`: an Atlassian API token. Enter it privately in GitHub; never commit it or paste it into chat.

Under **Variables**, add:

- `CONFLUENCE_API_BASE`: `https://cesarnaja.atlassian.net` for an API token without scopes. Do not include `/wiki`.
- `CONFLUENCE_PAGE_ID`: `950273`, the dedicated **SauceDemo — Test Automation & Results** page: `https://cesarnaja.atlassian.net/wiki/x/AYAO`. Your personal Overview page (`163939`) is reserved for your biography and is no longer the reporting destination.

For a **scoped** API token, instead use `https://api.atlassian.com/ex/confluence/YOUR_CLOUD_ID` as `CONFLUENCE_API_BASE`. The token needs `read:page:confluence` and `write:page:confluence`. The account must also be able to view and edit the page and its space. Your cloud ID can be found by opening `https://cesarnaja.atlassian.net/_edge/tenant_info` while signed in. Create tokens in [Atlassian account security](https://id.atlassian.com/manage-profile/security/api-tokens); choose an expiration and rotate the GitHub secret when needed.

Commit and push these files to the default branch. The publishing job stays disabled until `CONFLUENCE_PAGE_ID` is set. Then open **Actions → Playwright Tests → Run workflow**, choose the default branch, and start a run. Verify both the test and publication jobs, then check the Confluence page. A failed test job remains failed even if the results publish successfully. A publishing failure also fails the workflow.

## What appears on the page

- A brief project overview, links to the repository/test plan, and local setup commands.
- Latest run status and timestamp in Chicago time.
- One row per workflow run: passed, failed, flaky, skipped, elapsed test time, browsers, and a link to the full run. Re-running the same workflow replaces its row with the newer attempt.
- Counts are browser test executions, excluding `setup`; one scenario across three browsers can count three times. Playwright's `expected` outcome is shown as passed and can include intentional expected failures. Retries are not extra tests. Flaky is separate from passed.
- Failed setup, installation, and missing reports show an execution issue rather than a misleading successful empty run.

## Schedule and retention

Tests run on pushes/PRs to main/master and at **9:15 a.m. Chicago time, Monday–Friday**. Manual runs are available. Publication occurs only for default-branch pushes, scheduled runs, and default-branch manual runs. PRs never receive Confluence secrets or publish results.

The table keeps **today plus the preceding four Chicago calendar dates**, including all runs in that interval. This is five days, not five runs or five weekdays. Daily cleanup at **10:15 a.m. Chicago time** removes expired rows even on weekends, without running browsers. It only saves a page version if rows actually change. GitHub can delay scheduled jobs, so cleanup happens when the job runs, not exactly at midnight. Public repositories can have inactive schedules disabled by GitHub.

No attachments are uploaded to Confluence. Full HTML reports remain in GitHub artifacts for **30 days** (existing policy); the small JSON artifact remains for **5 days**. To open the HTML report, download and extract the artifact and use `npx playwright show-report <extracted-folder>`. Access follows GitHub repository permissions; this is not a public report-hosting URL.

Confluence keeps page version history: removing rows from the current table does **not** permanently purge their older versions or guarantee a hard five-day storage limit. Existing attachments are untouched. The compact JSON in the collapsed publisher-data section stores only result summaries and run links. Do not edit that data or the managed section heading/end marker.

## Local verification

```powershell
node --test scripts/publish-confluence.test.mjs
npx playwright test --list
node scripts/publish-confluence.mjs --preview
```

The preview creates `confluence-preview.html` without credentials or network calls. If a JSON report does not exist it deliberately previews a failed/missing-report state. To preview a real report with successful job status, set `$env:TEST_JOB_RESULT = 'success'` first, then run the preview. Never set credentials just to preview.

## Troubleshooting

- Publishing skipped: set the page ID variable and run on the default branch.
- HTTP 401: check token/email, token expiration, and scoped-token API gateway base.
- HTTP 403/404: check the numeric page ID and the account's access to that page/space.
- HTTP 409: the publisher retries after re-reading the latest version and merging history. Workflow concurrency serializes publishers/cleanup. If the page keeps changing, finish the manual edit and retry.
- Missing publisher markers/data: restore the previous intact page version. The script stops instead of discarding history or replacing unrelated content.

References: [Confluence page REST API](https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/), [API authentication](https://developer.atlassian.com/cloud/confluence/basic-auth-for-rest-apis/), [Atlassian API tokens](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/), [Confluence storage](https://support.atlassian.com/confluence-cloud/docs/manage-your-storage-usage/).
