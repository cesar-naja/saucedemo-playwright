import { test, expect } from '@playwright/test';

import { LoginPage } from '../src/pages/login.page';
import { BasePage } from '../src/pages/base.page';
import { users, PASSWORD } from '../data/users';


test('User can login to the application', async ({ page }) => {
    const loginPage : LoginPage = new LoginPage(page);

    await loginPage.goto();
  
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Swag Labs/);
    

    await loginPage.swagLabsHeaderIsVisible();
    
    await loginPage.login(users.standard, PASSWORD);
})  