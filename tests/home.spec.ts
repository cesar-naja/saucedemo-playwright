// spec: docs/home-test-plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../src/pages/home.page';
import { CartPage } from '../src/pages/cart.page';
import { ProductDetailsPage } from '../src/pages/product-details.page';
import { MenuPage } from '../src/pages/menu.page';
import { LoginPage } from '../src/pages/login.page';

const products = [
    { name: 'Sauce Labs Backpack', price: '$29.99' },
    { name: 'Sauce Labs Bike Light', price: '$9.99' },
    { name: 'Sauce Labs Bolt T-Shirt', price: '$15.99' },
    { name: 'Sauce Labs Fleece Jacket', price: '$49.99' },
    { name: 'Sauce Labs Onesie', price: '$7.99' },
    { name: 'Test.allTheThings() T-Shirt (Red)', price: '$15.99' },
];

test.describe('Page Contents', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        // Note: the server answers /inventory.html with HTTP 404 and then serves the SPA
        // via /?/inventory.html (200), so the response status is intentionally not asserted.
        await homePage.goto();
    });

    test('HP-01 Page loads with header and title', async ({ page }) => {
        // 1. Navigate to /inventory.html using the saved authenticated state
        await expect(page).toHaveURL(/\/inventory\.html$/);
        await homePage.swagLabsHeaderIsVisible();
        await expect(homePage.pageTitle).toHaveText('Products');
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, empty');
        await expect(homePage.cartBadge).toHaveCount(0);
    });

    test('HP-02 Product list shows 6 complete items', async () => {
        // 1. Navigate to /inventory.html and inspect each product card
        await expect(homePage.inventoryItems).toHaveCount(products.length);
        await expect(homePage.sortDropdown).toHaveValue('az');

        for (const { name, price } of products) {
            await expect(homePage.productName(name)).toHaveText(name);
            await expect(homePage.productPrice(name)).toHaveText(price);
            await expect(homePage.productDescription(name)).not.toBeEmpty();
            await expect(homePage.productImage(name)).toHaveAttribute('alt', name);
            await expect(homePage.productImage(name)).toHaveJSProperty('complete', true);
            await expect(homePage.addToCartButton(name)).toHaveText('Add to cart');
        }
    });

    test('HP-03 Footer links and copyright', async () => {
        // 1. Navigate to /inventory.html and inspect the footer
        const links = [
            { id: 'social-x', href: 'https://x.com/saucelabs' },
            { id: 'social-facebook', href: 'https://www.facebook.com/saucelabs' },
            { id: 'social-linkedin', href: 'https://www.linkedin.com/company/sauce-labs/' },
        ] as const;

        for (const { id, href } of links) {
            await expect(homePage.footerLink(id)).toHaveAttribute('href', href);
            await expect(homePage.footerLink(id)).toHaveAttribute('target', '_blank');
        }
        // Year is not hard-coded on purpose
        await expect(homePage.footerCopy).toContainText('Sauce Labs. All Rights Reserved.');
    });
});

test.describe('Cart Operations', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        // Each test gets a fresh context (saved auth only), so the cart starts empty
        homePage = new HomePage(page);
        await homePage.goto();
        await expect(homePage.cartBadge).toHaveCount(0);
    });

    test('HP-04 Add one item to the cart', async () => {
        const item = 'Sauce Labs Backpack';

        // 1. Click 'Add to cart' on Sauce Labs Backpack
        await homePage.addToCart(item);

        await expect(homePage.removeButton(item)).toHaveText('Remove');
        await expect(homePage.cartBadge).toHaveText('1');
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, 1 items');
    });

    test('HP-05 Remove an item from the inventory page', async () => {
        const item = 'Sauce Labs Backpack';

        // 1. Add Sauce Labs Backpack to the cart
        await homePage.addToCart(item);
        await expect(homePage.cartBadge).toHaveText('1');

        // 2. Click 'Remove' on Sauce Labs Backpack
        await homePage.removeFromCart(item);

        await expect(homePage.addToCartButton(item)).toHaveText('Add to cart');
        await expect(homePage.cartBadge).toHaveCount(0);
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, empty');
    });

    test('HP-06 Add multiple items to the cart', async () => {
        const added = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Test.allTheThings() T-Shirt (Red)'];
        const notAdded = ['Sauce Labs Bolt T-Shirt', 'Sauce Labs Fleece Jacket', 'Sauce Labs Onesie'];

        // 1. Add Backpack, Bike Light and Test.allTheThings() T-Shirt (Red)
        for (const item of added) {
            await homePage.addToCart(item);
        }

        await expect(homePage.cartBadge).toHaveText('3');
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, 3 items');
        for (const item of added) {
            await expect(homePage.removeButton(item)).toHaveText('Remove');
        }
        for (const item of notAdded) {
            await expect(homePage.addToCartButton(item)).toHaveText('Add to cart');
        }
    });

    test('HP-07 Cart state persists after reload', async ({ page }) => {
        const added = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Test.allTheThings() T-Shirt (Red)'];
        const notAdded = ['Sauce Labs Bolt T-Shirt', 'Sauce Labs Fleece Jacket', 'Sauce Labs Onesie'];

        // 1. Add Backpack, Bike Light and Test.allTheThings() T-Shirt (Red)
        for (const item of added) {
            await homePage.addToCart(item);
        }
        await expect(homePage.cartBadge).toHaveText('3');

        // 2. Reload /inventory.html
        await page.reload();

        await expect(homePage.cartBadge).toHaveText('3');
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, 3 items');
        for (const item of added) {
            await expect(homePage.removeButton(item)).toHaveText('Remove');
        }
        for (const item of notAdded) {
            await expect(homePage.addToCartButton(item)).toHaveText('Add to cart');
        }
    });

    test('HP-08 Cart page lists the added items', async ({ page }) => {
        const cartPage = new CartPage(page);
        const expectedItems = [
            { name: 'Sauce Labs Bike Light', price: '$9.99' },
            { name: 'Test.allTheThings() T-Shirt (Red)', price: '$15.99' },
        ];

        // 1. Add Bike Light and Test.allTheThings() T-Shirt (Red), then click the cart button
        for (const { name } of expectedItems) {
            await homePage.addToCart(name);
        }
        await expect(homePage.cartBadge).toHaveText('2');
        await homePage.cartLink.click();

        await expect(page).toHaveURL(/\/cart\.html$/);
        await expect(cartPage.pageTitle).toHaveText('Your Cart');
        await expect(cartPage.cartItems).toHaveCount(expectedItems.length);
        for (const { name, price } of expectedItems) {
            await expect(cartPage.cartItem(name)).toBeVisible();
            await expect(cartPage.itemQuantity(name)).toHaveText('1');
            await expect(cartPage.itemDescription(name)).not.toBeEmpty();
            await expect(cartPage.itemPrice(name)).toHaveText(price);
            await expect(cartPage.removeButton(name)).toHaveText('Remove');
        }
        await expect(cartPage.continueShoppingButton).toHaveText('Continue Shopping');
        await expect(cartPage.checkoutButton).toHaveText('Checkout');

        // 2. Navigate back with the browser Back button
        await page.goBack();

        await expect(page).toHaveURL(/\/inventory\.html$/);
        await expect(homePage.cartBadge).toHaveText('2');
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, 2 items');
        for (const { name } of expectedItems) {
            await expect(homePage.removeButton(name)).toHaveText('Remove');
        }
    });

    test('HP-09 Empty-cart baseline on a fresh context', async () => {
        // 1. Open /inventory.html in a new test (fresh context with saved auth only)
        await expect(homePage.cartBadge).toHaveCount(0);
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, empty');
        await expect(homePage.inventoryItems).toHaveCount(products.length);
        for (const { name } of products) {
            await expect(homePage.addToCartButton(name)).toHaveText('Add to cart');
        }
        await expect(homePage.removeButtons).toHaveCount(0);
    });
});

test.describe('Sorting', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goto();
        await expect(homePage.inventoryItems).toHaveCount(products.length);
    });

    test('HP-10 Sort Name (Z to A)', async () => {
        // 1. Select 'Name (Z to A)'
        await homePage.sortBy('za');

        await expect(homePage.sortDropdown).toHaveValue('za');
        await expect(homePage.productNames).toHaveText([
            'Test.allTheThings() T-Shirt (Red)',
            'Sauce Labs Onesie',
            'Sauce Labs Fleece Jacket',
            'Sauce Labs Bolt T-Shirt',
            'Sauce Labs Bike Light',
            'Sauce Labs Backpack',
        ]);
    });

    test('HP-11 Sort Price (low to high)', async () => {
        // 1. Select 'Price (low to high)'
        await homePage.sortBy('lohi');

        await expect(homePage.sortDropdown).toHaveValue('lohi');
        // Tied $15.99 items keep A-Z order: Bolt T-Shirt, then Test.allTheThings() T-Shirt (Red)
        await expect(homePage.productNames).toHaveText([
            'Sauce Labs Onesie',
            'Sauce Labs Bike Light',
            'Sauce Labs Bolt T-Shirt',
            'Test.allTheThings() T-Shirt (Red)',
            'Sauce Labs Backpack',
            'Sauce Labs Fleece Jacket',
        ]);
        await expect(homePage.productPrices).toHaveText(['$7.99', '$9.99', '$15.99', '$15.99', '$29.99', '$49.99']);

        const amounts = (await homePage.productPrices.allTextContents()).map((p) => parseFloat(p.replace('$', '')));
        expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
    });

    test('HP-12 Sort Price (high to low)', async () => {
        // 1. Select 'Price (high to low)'
        await homePage.sortBy('hilo');

        await expect(homePage.sortDropdown).toHaveValue('hilo');
        // Tied $15.99 items keep A-Z order: Bolt T-Shirt, then Test.allTheThings() T-Shirt (Red)
        await expect(homePage.productNames).toHaveText([
            'Sauce Labs Fleece Jacket',
            'Sauce Labs Backpack',
            'Sauce Labs Bolt T-Shirt',
            'Test.allTheThings() T-Shirt (Red)',
            'Sauce Labs Bike Light',
            'Sauce Labs Onesie',
        ]);
        await expect(homePage.productPrices).toHaveText(['$49.99', '$29.99', '$15.99', '$15.99', '$9.99', '$7.99']);

        const amounts = (await homePage.productPrices.allTextContents()).map((p) => parseFloat(p.replace('$', '')));
        expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    });

    test('HP-13 Sort selection resets on reload', async ({ page }) => {
        // 1. Select 'Price (high to low)'
        await homePage.sortBy('hilo');
        await expect(homePage.sortDropdown).toHaveValue('hilo');
        await expect(homePage.productNames.first()).toHaveText('Sauce Labs Fleece Jacket');

        // 2. Reload /inventory.html
        await page.reload();

        // Observed behavior: the sort selection is not persisted
        await expect(homePage.sortDropdown).toHaveValue('az');
        await expect(homePage.sortDropdown.locator('option:checked')).toHaveText('Name (A to Z)');
        await expect(homePage.productNames.first()).toHaveText('Sauce Labs Backpack');
        await expect(homePage.productNames).toHaveText([
            'Sauce Labs Backpack',
            'Sauce Labs Bike Light',
            'Sauce Labs Bolt T-Shirt',
            'Sauce Labs Fleece Jacket',
            'Sauce Labs Onesie',
            'Test.allTheThings() T-Shirt (Red)',
        ]);
    });
});

test.describe('Product Details', () => {
    let homePage: HomePage;
    let detailsPage: ProductDetailsPage;

    test.beforeEach(async ({ page }) => {
        // Each test gets a fresh context (saved auth only), so the cart starts empty
        homePage = new HomePage(page);
        detailsPage = new ProductDetailsPage(page);
        await homePage.goto();
        await expect(homePage.inventoryItems).toHaveCount(products.length);
        await expect(homePage.cartBadge).toHaveCount(0);
    });

    test('HP-14 Open product details via name', async ({ page }) => {
        const item = 'Sauce Labs Backpack';
        const price = '$29.99';
        const description = (await homePage.productDescription(item).textContent()) ?? '';
        const imageSrc = await homePage.productImage(item).getAttribute('src');
        expect(description).not.toBe('');

        // 1. Click the 'Sauce Labs Backpack' name button
        await homePage.openProductByName(item);

        await expect(page).toHaveURL(/\/inventory-item\.html\?id=4$/);
        await expect(detailsPage.name).toHaveText(item);
        await expect(detailsPage.description).toHaveText(description);
        await expect(detailsPage.price).toHaveText(price);
        await expect(detailsPage.image).toHaveAttribute('alt', item);
        await expect(detailsPage.image).toHaveAttribute('src', imageSrc!);
        await expect(detailsPage.image).toHaveJSProperty('complete', true);
        await expect(detailsPage.backToProductsButton).toHaveText('Back to products');
        await expect(detailsPage.addToCartButton).toHaveText('Add to cart');
        await expect(detailsPage.removeButton).toHaveCount(0);
    });

    test('HP-15 Open product details via image', async ({ page }) => {
        const item = 'Sauce Labs Bike Light';
        const price = '$9.99';
        const description = (await homePage.productDescription(item).textContent()) ?? '';
        const imageSrc = await homePage.productImage(item).getAttribute('src');
        expect(description).not.toBe('');

        // 1. Click the Bike Light image (data-test item-0-img-link)
        await homePage.openProductByImage(item);

        await expect(page).toHaveURL(/\/inventory-item\.html\?id=0$/);
        await expect(detailsPage.name).toHaveText(item);
        await expect(detailsPage.description).toHaveText(description);
        await expect(detailsPage.price).toHaveText(price);
        await expect(detailsPage.image).toHaveAttribute('alt', item);
        await expect(detailsPage.image).toHaveAttribute('src', imageSrc!);
        await expect(detailsPage.backToProductsButton).toHaveText('Back to products');
    });

    test('HP-16 Remove from the details page updates the cart', async ({ page }) => {
        const item = 'Sauce Labs Backpack';
        const stillAdded = ['Sauce Labs Bike Light', 'Test.allTheThings() T-Shirt (Red)'];

        // 1. Add Backpack, Bike Light and Test.allTheThings() T-Shirt (Red); open Backpack details
        for (const name of [item, ...stillAdded]) {
            await homePage.addToCart(name);
        }
        await expect(homePage.cartBadge).toHaveText('3');
        await homePage.openProductByName(item);

        await expect(page).toHaveURL(/\/inventory-item\.html\?id=4$/);
        await expect(detailsPage.removeButton).toHaveText('Remove');
        await expect(detailsPage.addToCartButton).toHaveCount(0);
        await expect(homePage.cartBadge).toHaveText('3');

        // 2. Click 'Remove' on the details page
        await detailsPage.removeButton.click();

        await expect(detailsPage.addToCartButton).toHaveText('Add to cart');
        await expect(detailsPage.removeButton).toHaveCount(0);
        await expect(homePage.cartBadge).toHaveText('2');
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, 2 items');

        // 3. Click 'Back to products'
        await detailsPage.backToProducts();

        await expect(page).toHaveURL(/\/inventory\.html$/);
        await expect(homePage.cartBadge).toHaveText('2');
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, 2 items');
        await expect(homePage.addToCartButton(item)).toHaveText('Add to cart');
        for (const name of stillAdded) {
            await expect(homePage.removeButton(name)).toHaveText('Remove');
        }
    });

    test('HP-17 Browser Back from details page', async ({ page }) => {
        const item = 'Sauce Labs Bike Light';

        // 1. Open Bike Light details, then use browser Back
        await homePage.openProductByName(item);
        await expect(page).toHaveURL(/\/inventory-item\.html\?id=0$/);
        await expect(detailsPage.name).toHaveText(item);

        await page.goBack();

        await expect(page).toHaveURL(/\/inventory\.html$/);
        await expect(homePage.pageTitle).toHaveText('Products');
        await expect(homePage.inventoryItems).toHaveCount(products.length);
        await expect(homePage.cartBadge).toHaveCount(0);
    });
});

test.describe('Menu', () => {
    let homePage: HomePage;
    let menuPage: MenuPage;

    test.beforeEach(async ({ page }) => {
        // Each test gets a fresh context (saved auth only), so the cart starts empty
        homePage = new HomePage(page);
        menuPage = new MenuPage(page);
        await homePage.goto();
        await expect(homePage.inventoryItems).toHaveCount(products.length);
        await expect(homePage.cartBadge).toHaveCount(0);
    });

    test('HP-18 Open and close the burger menu', async () => {
        await expect(menuPage.container).toHaveAttribute('aria-hidden', 'true');

        // 1. Click the 'Open Menu' button (located by role, not the data-test='open-menu' img)
        await menuPage.open();

        await expect(menuPage.container).toHaveAttribute('aria-hidden', 'false');
        await expect(menuPage.allItemsLink).toHaveText('All Items');
        await expect(menuPage.dynamicCatalogLink).toHaveText('Dynamic Catalog');
        await expect(menuPage.aboutLink).toHaveText('About');
        await expect(menuPage.logoutLink).toHaveText('Logout');
        await expect(menuPage.resetAppStateLink).toHaveText('Reset App State');
        await expect(menuPage.closeButton).toBeVisible();

        // 2. Click the 'Close Menu' button
        await menuPage.close();

        await expect(menuPage.container).toHaveAttribute('aria-hidden', 'true');
        await expect(menuPage.logoutLink).toBeHidden();
    });

    test('HP-19 Menu: All Items from a details page', async ({ page }) => {
        const item = 'Sauce Labs Onesie';

        // 1. Open Onesie details, open the menu, click All Items
        await homePage.openProductByName(item);
        await expect(page).toHaveURL(/\/inventory-item\.html\?id=2$/);

        await menuPage.open();
        await expect(menuPage.container).toHaveAttribute('aria-hidden', 'false');
        await menuPage.allItemsLink.click();

        await expect(page).toHaveURL(/\/inventory\.html$/);
        await expect(homePage.pageTitle).toHaveText('Products');
        await expect(homePage.inventoryItems).toHaveCount(products.length);
        await expect(menuPage.container).toHaveAttribute('aria-hidden', 'true');
        await expect(menuPage.allItemsLink).toBeHidden();
    });

    test('HP-20 Menu: Reset App State', async ({ page }) => {
        const added = ['Sauce Labs Backpack', 'Sauce Labs Onesie'];

        // 1. Add Backpack and Onesie
        for (const item of added) {
            await homePage.addToCart(item);
        }
        await expect(homePage.cartBadge).toHaveText('2');

        // 2. Open the menu and click 'Reset App State'
        await menuPage.open();
        await menuPage.resetAppStateLink.click();

        // Immediately after reset the badge and stored cart are cleared...
        await expect(homePage.cartBadge).toHaveCount(0);
        await expect(homePage.cartLink).toHaveAttribute('aria-label', 'Cart, empty');
        expect(await page.evaluate(() => localStorage.getItem('cart-contents'))).toBeNull();
        // ...but documented quirk: the buttons still show 'Remove' and the menu stays open
        for (const item of added) {
            await expect(homePage.removeButton(item)).toHaveText('Remove');
        }
        await expect(menuPage.container).toHaveAttribute('aria-hidden', 'false');

        // 3. Reload the page
        await page.reload();

        await expect(homePage.cartBadge).toHaveCount(0);
        await expect(homePage.removeButtons).toHaveCount(0);
        for (const { name } of products) {
            await expect(homePage.addToCartButton(name)).toHaveText('Add to cart');
        }
        await expect(menuPage.container).toHaveAttribute('aria-hidden', 'true');
    });

    test('HP-21 Menu: Logout blocks protected inventory access', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. Start authenticated, open the menu and click 'Logout'
        await menuPage.open();
        await menuPage.logoutLink.click();

        await expect(page).toHaveURL(/\/$/);
        await expect(loginPage.loginButton).toBeVisible();

        // 2. In the same context, navigate directly to /inventory.html
        await page.goto('/inventory.html');

        await expect(page).toHaveURL(/\/$/);
        await expect(loginPage.usernameInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();
        await expect(loginPage.errorMessage).toHaveText("Epic sadface: You can only access '/inventory.html' when you are logged in.");
        await expect(homePage.inventoryItems).toHaveCount(0);
    });

    test('HP-22 Menu: About link target', async () => {
        // 1. Open the menu and inspect the About link (not clicked: navigation is unverified in the plan)
        await menuPage.open();

        await expect(menuPage.aboutLink).toHaveText('About');
        await expect(menuPage.aboutLink).toHaveAttribute('href', 'https://saucelabs.com/');
    });

    test('HP-23 Menu: Dynamic Catalog submenu', async ({ page }) => {
        // 1. Open the menu; the submenu items are not visible yet
        await menuPage.open();
        await expect(menuPage.lazyLoadItem).toBeHidden();
        await expect(menuPage.spinnerItem).toBeHidden();
        await expect(menuPage.sliderItem).toBeHidden();

        // 2. Click 'Dynamic Catalog' (submenu items are only checked for visibility, not clicked)
        await menuPage.dynamicCatalogLink.click();

        await expect(menuPage.lazyLoadItem).toBeVisible();
        await expect(menuPage.spinnerItem).toBeVisible();
        await expect(menuPage.sliderItem).toBeVisible();
        await expect(page).toHaveURL(/\/inventory\.html$/);
    });
});
