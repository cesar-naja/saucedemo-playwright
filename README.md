# Sauce Demo Playwright Tests

End-to-end tests for the [Sauce Demo](https://www.saucedemo.com/) inventory page, built with Playwright, TypeScript and the Page Object Model.

[![Playwright Tests](https://github.com/cesar-naja/saucedemo-playwright/actions/workflows/playwright.yml/badge.svg)](https://github.com/cesar-naja/saucedemo-playwright/actions/workflows/playwright.yml)
![Playwright](https://img.shields.io/badge/Playwright-45ba4b?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)

## Overview

The suite covers the logged-in inventory page of Sauce Demo: page contents, cart, sorting, product details and the burger menu. Each of the 23 scenarios (HP-01 to HP-23) is traced to a written [test plan](docs/home-test-plan.md), which was explored against the live site with the Playwright MCP planner and generator. Tests share one saved login through a setup project and use page objects to keep specs readable.
<!-- screenshot: playwright report -->
## Highlights

- **Independent tests:** every test starts in a fresh browser context with only the saved login, so the cart always starts empty and tests do not depend on order.
- **One test per scenario ID:** test names start with the plan ID, for example `HP-20 Menu: Reset App State`.
- **Locator strategy:** the site uses `data-test` attributes, so locators use those rather than `data-testid`. The menu buttons carry `data-test` on an inner `<img>`, so they are located by role (`Open Menu`, `Close Menu`).
- **Documented quirks asserted on purpose:** after Reset App State the badge clears but buttons still show "Remove" and the menu stays open until a reload. Navigating to `/inventory.html` returns HTTP 404 before the page renders, so tests assert URL and content, not the status.
- **Logout test stays authenticated first:** HP-21 logs out through the menu, then visits `/inventory.html` in the same context and checks the login redirect and error message.
- **Page Object Model:** `src/pages/` holds the locators and actions, and assertions stay in the specs.

## Tech stack

- [Playwright Test](https://playwright.dev/) `^1.64.0`
- TypeScript
- GitHub Actions

## Getting started

Requires [Node.js](https://nodejs.org/) (LTS) and npm.

```bash
npm ci
npx playwright install
```

To install only Chromium: `npx playwright install chromium`. The commands are the same in Windows PowerShell and macOS/Linux shells.

## Running the tests

```bash
npx playwright test                          # all projects
npx playwright test --project=chromium       # Chromium only (runs the setup project first)
npx playwright test tests/home.spec.ts       # one file
npx playwright test --ui                     # UI mode
npx playwright test --headed                 # watch the browser
npx playwright show-report                   # open the last HTML report
```

The config defines `chromium`, `firefox` and `webkit` projects, plus the `setup` project they depend on.

## Project structure

```
.github/workflows/   GitHub Actions workflow
data/users.ts        Sauce Demo usernames and shared password
docs/                Test plan (home-test-plan.md)
src/pages/           Page objects: base, login, home, cart, product details, menu
tests/
  auth.setup.ts      Logs in once and saves the session
  home.spec.ts       HP-01 to HP-23
  login.spec.ts      Login smoke test
  seed.spec.ts       Seed test used by the planner and generator
playwright.config.ts
```

## How authentication works

`tests/auth.setup.ts` runs as the `setup` project. It logs in as the standard user and saves the browser session to `playwright/.auth/user.json`. The browser projects list `setup` as a dependency and load that file through `storageState`, so tests begin already logged in. The `playwright/.auth/` folder is listed in `.gitignore` and is recreated on every run.

## CI

The workflow in `.github/workflows/playwright.yml` runs on pushes and pull requests to `main` or `master`. It installs dependencies and browsers, runs `npx playwright test`, and uploads the HTML report as an artifact kept for 30 days.

## Test plan and AI-assisted workflow

The plan in [`docs/home-test-plan.md`](docs/home-test-plan.md) was produced by exploring the live inventory page with the Playwright MCP planner, with unverified behavior marked as unknown. Each test was then verified step by step in a live browser through the generator before being written to `tests/home.spec.ts`. The tests run against the public Sauce Demo site, so a site outage or slow response can fail a run unrelated to the code.
