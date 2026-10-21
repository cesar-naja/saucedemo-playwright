import { Page, Locator, expect } from "@playwright/test";

export abstract class BasePage {

    protected readonly swagLabsHeader : Locator;

    constructor(protected readonly page: Page){
        this.swagLabsHeader = page.locator('.locator_logo, .app_logo')
    }

    async swagLabsHeaderIsVisible(){
        console.log("Swag Labs Function Triggered")
        await expect(this.swagLabsHeader).toHaveText('Swag Labs');
    }
}