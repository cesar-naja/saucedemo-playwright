import { Page, Locator, expect } from "@playwright/test";

export abstract class BasePage {

    protected readonly swagLabsHeader : Locator;

    constructor(protected readonly page: Page){
        //this.swagLabsHeader = page.locator('locator_logo, app_logo')
        this.swagLabsHeader = page.getByText('Swag Labs');
    }

    async swagLabsHeaderIsVisible(){
        await expect(this.swagLabsHeader).toBeVisible();
    }
}