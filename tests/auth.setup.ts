// tests/auth.setup.ts
import { test as setup } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import { users, PASSWORD } from '../data/users';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard, PASSWORD);
    await page.waitForURL(/inventory/);
    await page.context().storageState({ path: authFile });
});