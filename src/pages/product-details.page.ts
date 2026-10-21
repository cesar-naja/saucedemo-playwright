import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class ProductDetailsPage extends BasePage {

    readonly image: Locator;
    readonly name: Locator;
    readonly description: Locator;
    readonly price: Locator;
    readonly backToProductsButton: Locator;
    readonly addToCartButton: Locator;
    readonly removeButton: Locator;

    constructor(page: Page) {
        super(page);
        const container = page.locator('[data-test="inventory-item"]');
        this.image = container.locator('img');
        this.name = page.locator('[data-test="inventory-item-name"]');
        this.description = page.locator('[data-test="inventory-item-desc"]');
        this.price = page.locator('[data-test="inventory-item-price"]');
        this.backToProductsButton = page.locator('[data-test="back-to-products"]');
        this.addToCartButton = page.locator('[data-test="add-to-cart"]');
        this.removeButton = page.locator('[data-test="remove"]');
    }

    async backToProducts() {
        await this.backToProductsButton.click();
    }
}
