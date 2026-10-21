import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class CartPage extends BasePage {

    readonly pageTitle: Locator;
    readonly cartItems: Locator;
    readonly continueShoppingButton: Locator;
    readonly checkoutButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = page.locator('[data-test="title"]');
        this.cartItems = page.locator('[data-test="inventory-item"]');
        this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
        this.checkoutButton = page.locator('[data-test="checkout"]');
    }

    cartItem(name: string): Locator {
        return this.cartItems.filter({
            has: this.page.locator('[data-test="inventory-item-name"]', { hasText: name }),
        });
    }

    itemQuantity(name: string): Locator {
        return this.cartItem(name).locator('[data-test="item-quantity"]');
    }

    itemDescription(name: string): Locator {
        return this.cartItem(name).locator('[data-test="inventory-item-desc"]');
    }

    itemPrice(name: string): Locator {
        return this.cartItem(name).locator('[data-test="inventory-item-price"]');
    }

    removeButton(name: string): Locator {
        return this.cartItem(name).locator('[data-test^="remove"]');
    }
}
