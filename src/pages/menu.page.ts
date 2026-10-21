import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class MenuPage extends BasePage {

    readonly openButton: Locator;
    readonly closeButton: Locator;
    readonly container: Locator;
    readonly allItemsLink: Locator;
    readonly dynamicCatalogLink: Locator;
    readonly aboutLink: Locator;
    readonly logoutLink: Locator;
    readonly resetAppStateLink: Locator;
    readonly lazyLoadItem: Locator;
    readonly spinnerItem: Locator;
    readonly sliderItem: Locator;

    constructor(page: Page) {
        super(page);
        // data-test="open-menu" / "close-menu" sit on <img> elements inside the real buttons,
        // so the buttons are located by role instead.
        this.openButton = page.getByRole('button', { name: 'Open Menu' });
        this.closeButton = page.getByRole('button', { name: 'Close Menu' });
        this.container = page.locator('.bm-menu-wrap');
        this.allItemsLink = page.locator('[data-test="inventory-sidebar-link"]');
        this.dynamicCatalogLink = page.locator('[data-test="dynamic-catalog-sidebar-link"]');
        this.aboutLink = page.locator('[data-test="about-sidebar-link"]');
        this.logoutLink = page.locator('[data-test="logout-sidebar-link"]');
        this.resetAppStateLink = page.locator('[data-test="reset-sidebar-link"]');
        const nav = page.getByRole('navigation');
        this.lazyLoadItem = nav.getByRole('button', { name: 'Lazy Load' });
        this.spinnerItem = nav.getByRole('button', { name: 'Spinner' });
        this.sliderItem = nav.getByRole('button', { name: 'Slider' });
    }

    async open() {
        await this.openButton.click();
    }

    async close() {
        await this.closeButton.click();
    }
}
