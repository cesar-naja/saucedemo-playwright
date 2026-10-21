import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class HomePage extends BasePage{

    readonly pageTitle: Locator;
    readonly inventoryItems: Locator;
    readonly cartBadge: Locator;
    readonly cartLink: Locator;
    readonly sortDropdown: Locator;
    readonly footerCopy: Locator;
    readonly removeButtons: Locator;
    readonly productNames: Locator;
    readonly productPrices: Locator;

    constructor(page: Page){
        super(page);
        this.pageTitle = page.locator('[data-test="title"]');
        this.inventoryItems = page.locator('[data-test="inventory-item"]');
        this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
        this.cartLink = page.locator('[data-test="shopping-cart-link"]');
        this.sortDropdown = page.locator('[data-test="product-sort-container"]');
        this.footerCopy = page.locator('[data-test="footer-copy"]');
        this.removeButtons = page.locator('[data-test^="remove"]');
        this.productNames = page.locator('[data-test="inventory-item-name"]');
        this.productPrices = page.locator('[data-test="inventory-item-price"]');
    }

    async sortBy(value: 'az' | 'za' | 'lohi' | 'hilo'){
        await this.sortDropdown.selectOption(value);
    }

    footerLink(dataTest: 'social-x' | 'social-facebook' | 'social-linkedin'): Locator {
        return this.page.locator(`[data-test="${dataTest}"]`);
    }

    async goto(){
        await this.page.goto('/inventory.html');
    }

    async validateHomePageHeaderIsVisible(){
        await this.swagLabsHeaderIsVisible();
    }

    productCard(name: string): Locator {
        return this.inventoryItems.filter({
            has: this.page.locator('[data-test="inventory-item-name"]', { hasText: name }),
        });
    }

    productImage(name: string): Locator {
        return this.productCard(name).locator('img');
    }

    productName(name: string): Locator {
        return this.productCard(name).locator('[data-test="inventory-item-name"]');
    }

    productDescription(name: string): Locator {
        return this.productCard(name).locator('[data-test="inventory-item-desc"]');
    }

    productPrice(name: string): Locator {
        return this.productCard(name).locator('[data-test="inventory-item-price"]');
    }

    addToCartButton(name: string): Locator {
        return this.productCard(name).locator('[data-test^="add-to-cart"]');
    }

    removeButton(name: string): Locator {
        return this.productCard(name).locator('[data-test^="remove"]');
    }

    productImageLink(name: string): Locator {
        return this.productCard(name).locator('[data-test$="-img-link"]');
    }

    async openProductByName(name: string){
        await this.productName(name).click();
    }

    async openProductByImage(name: string){
        await this.productImageLink(name).click();
    }

    async addToCart(name: string){
        await this.addToCartButton(name).click();
    }

    async removeFromCart(name: string){
        await this.removeButton(name).click();
    }
}
