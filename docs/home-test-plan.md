# Sauce Demo Inventory (Home) Page Test Plan

## Application Overview

Plan for https://www.saucedemo.com/inventory.html, explored live on 2026-10-12 as standard_user using the chromium project (storageState from the setup project) with seed tests/seed.spec.ts. Page: header (burger menu, 'Swag Labs' logo, cart button with badge), 'Products' title, sort dropdown, 6 products (image button, name button, description, price, Add to cart/Remove), footer (X, Facebook, LinkedIn, copyright). Locator notes verified live: data-test attributes (not data-testid) are used, so getByTestId needs testIdAttribute='data-test' or CSS selectors. Product name and image are BUTTONS with href='#' (navigation is JS-driven), the cart is a button (no href), and data-test='open-menu' / 'close-menu' sit on an <img> inside the real button, so use getByRole('button', {name:'Open Menu'}) to open the menu; clicking the img data-test timed out. Add/Remove buttons: add-to-cart-<slug> / remove-<slug>; the slug for the last product is 'test.allthethings()-t-shirt-(red)'. Cart state is stored in localStorage key 'cart-contents' (e.g. [4,0,3]) and survives reloads within a browser context; a fresh context starts empty. Catalog: Backpack $29.99 (id 4), Bike Light $9.99 (id 0), Bolt T-Shirt $15.99 (id 1), Fleece Jacket $49.99 (id 5), Onesie $7.99 (id 2), Test.allTheThings() T-Shirt (Red) $15.99 (id 3). Already implemented in tests/home.spec.ts: HP-01 to HP-05. Direct goto('/inventory.html') returned HTTP 404 in the tool log but the app still rendered normally. Not verified / UNKNOWN: where Dynamic Catalog > Lazy Load / Spinner / Slider lead, whether the footer links actually open the external sites, whether the About click navigates to saucelabs.com (only the href was verified), keyboard accessibility, responsive layout, other user types, and checkout flow.

## Test Scenarios

### 1. Page Contents

**Seed:** `tests/seed.spec.ts`

#### 1.1. HP-01 Page loads with header and title

**File:** `tests/home.spec.ts`

**Steps:**
  1. Navigate to /inventory.html using the saved authenticated state
    - expect: URL is /inventory.html
    - expect: 'Swag Labs' logo is visible
    - expect: 'Products' title is visible
    - expect: Cart shows as empty ('Cart, empty') with no badge

#### 1.2. HP-02 Product list shows 6 complete items

**File:** `tests/home.spec.ts`

**Steps:**
  1. Navigate to /inventory.html and inspect each product card
    - expect: Exactly 6 inventory items are displayed
    - expect: Each card has a loaded image whose alt equals the product name, a name, a non-empty description, a price, and an 'Add to cart' button
    - expect: Names and prices match: Backpack $29.99, Bike Light $9.99, Bolt T-Shirt $15.99, Fleece Jacket $49.99, Onesie $7.99, Test.allTheThings() T-Shirt (Red) $15.99
    - expect: Default order is Name (A to Z) with sort dropdown value 'az'

#### 1.3. HP-03 Footer links and copyright

**File:** `tests/home.spec.ts`

**Steps:**
  1. Navigate to /inventory.html and inspect the footer
    - expect: Links X (https://x.com/saucelabs), Facebook (https://www.facebook.com/saucelabs), LinkedIn (https://www.linkedin.com/company/sauce-labs/) are present with target=_blank
    - expect: Copyright text contains 'Sauce Labs. All Rights Reserved.' (year shown was 2026; do not hard-code the year)
    - expect: UNKNOWN: whether clicking each link opens the external site in a new tab (not clicked)

### 2. Cart Operations

**Seed:** `tests/seed.spec.ts`

#### 2.1. HP-04 Add one item to the cart

**File:** `tests/home.spec.ts`

**Steps:**
  1. Click 'Add to cart' on Sauce Labs Backpack
    - expect: Button changes to 'Remove'
    - expect: Cart badge shows 1 and the cart label reads 'Cart, 1 items'

#### 2.2. HP-05 Remove an item from the inventory page

**File:** `tests/home.spec.ts`

**Steps:**
  1. Add Sauce Labs Backpack to the cart
    - expect: Badge shows 1
  2. Click 'Remove' on Sauce Labs Backpack
    - expect: Button reverts to 'Add to cart'
    - expect: Cart badge element is removed from the DOM and the label reads 'Cart, empty'

#### 2.3. HP-06 Add multiple items to the cart

**File:** `tests/home.spec.ts`

**Steps:**
  1. Add Backpack, Bike Light and Test.allTheThings() T-Shirt (Red)
    - expect: Badge shows 3 and label reads 'Cart, 3 items'
    - expect: Those three buttons show 'Remove'; the other three still show 'Add to cart'

#### 2.4. HP-07 Cart state persists after reload

**File:** `tests/home.spec.ts`

**Steps:**
  1. Add Backpack, Bike Light and Test.allTheThings() T-Shirt (Red), then reload /inventory.html
    - expect: Badge still shows 3
    - expect: The same three items still show 'Remove' (state is read from localStorage 'cart-contents')

#### 2.5. HP-08 Cart page lists the added items

**File:** `tests/home.spec.ts`

**Steps:**
  1. Add Bike Light and Test.allTheThings() T-Shirt (Red), then click the cart button
    - expect: URL is /cart.html
    - expect: Cart lists exactly those two items, each with quantity 1, description, price ($9.99 and $15.99) and a Remove button
    - expect: 'Continue Shopping' and 'Checkout' buttons are present (their behavior is out of scope / UNKNOWN)
  2. Navigate back with the browser Back button
    - expect: Returns to /inventory.html with the badge still showing 2

#### 2.6. HP-09 Empty-cart baseline on a fresh context

**File:** `tests/home.spec.ts`

**Steps:**
  1. Open /inventory.html in a new test (fresh context with saved auth only)
    - expect: No cart badge
    - expect: All 6 buttons show 'Add to cart'

### 3. Sorting

**Seed:** `tests/seed.spec.ts`

#### 3.1. HP-10 Sort Name (Z to A)

**File:** `tests/home.spec.ts`

**Steps:**
  1. Select 'Name (Z to A)' in the sort dropdown
    - expect: Order: Test.allTheThings() T-Shirt (Red), Onesie, Fleece Jacket, Bolt T-Shirt, Bike Light, Backpack
    - expect: Dropdown value is 'za'

#### 3.2. HP-11 Sort Price (low to high)

**File:** `tests/home.spec.ts`

**Steps:**
  1. Select 'Price (low to high)'
    - expect: Prices: $7.99, $9.99, $15.99, $15.99, $29.99, $49.99
    - expect: Order: Onesie, Bike Light, Bolt T-Shirt, Test.allTheThings() T-Shirt (Red), Backpack, Fleece Jacket (the two $15.99 items stay in A-Z order)

#### 3.3. HP-12 Sort Price (high to low)

**File:** `tests/home.spec.ts`

**Steps:**
  1. Select 'Price (high to low)'
    - expect: Prices: $49.99, $29.99, $15.99, $15.99, $9.99, $7.99
    - expect: Order: Fleece Jacket, Backpack, Bolt T-Shirt, Test.allTheThings() T-Shirt (Red), Bike Light, Onesie

#### 3.4. HP-13 Sort selection resets on reload

**File:** `tests/home.spec.ts`

**Steps:**
  1. Select 'Price (high to low)', then reload /inventory.html
    - expect: Dropdown is back to 'Name (A to Z)' (value 'az') and Backpack is first. Observed behavior: sort is not persisted.

### 4. Product Details

**Seed:** `tests/seed.spec.ts`

#### 4.1. HP-14 Open product details via name

**File:** `tests/home.spec.ts`

**Steps:**
  1. Click the 'Sauce Labs Backpack' name button
    - expect: URL is /inventory-item.html?id=4
    - expect: Details show image, name, description and $29.99 matching the list
    - expect: 'Back to products' button and an Add to cart/Remove button are visible

#### 4.2. HP-15 Open product details via image

**File:** `tests/home.spec.ts`

**Steps:**
  1. Click the Bike Light image (data-test item-0-img-link)
    - expect: URL is /inventory-item.html?id=0
    - expect: Bike Light details are shown

#### 4.3. HP-16 Remove from the details page updates the cart

**File:** `tests/home.spec.ts`

**Steps:**
  1. Add Backpack, Bike Light and Test.allTheThings() T-Shirt (Red); open Backpack details
    - expect: Backpack button shows 'Remove' and badge shows 3
  2. Click 'Remove' (data-test 'remove') on the details page
    - expect: Button becomes 'Add to cart' (data-test 'add-to-cart') and badge shows 2
  3. Click 'Back to products' (data-test 'back-to-products')
    - expect: URL is /inventory.html, badge shows 2, Backpack shows 'Add to cart'

#### 4.4. HP-17 Browser Back from details page

**File:** `tests/home.spec.ts`

**Steps:**
  1. Open Bike Light details, then use browser Back
    - expect: Returns to /inventory.html

### 5. Menu

**Seed:** `tests/seed.spec.ts`

#### 5.1. HP-18 Open and close the burger menu

**File:** `tests/home.spec.ts`

**Steps:**
  1. Click the 'Open Menu' button (use role; not the data-test='open-menu' img)
    - expect: Menu shows All Items, Dynamic Catalog, About, Logout, Reset App State
    - expect: Menu container aria-hidden becomes 'false'
  2. Click the 'Close Menu' button
    - expect: Menu container aria-hidden becomes 'true'

#### 5.2. HP-19 Menu: All Items from a details page

**File:** `tests/home.spec.ts`

**Steps:**
  1. Open Onesie details, open the menu, click All Items
    - expect: URL is /inventory.html and the menu is closed afterwards

#### 5.3. HP-20 Menu: Reset App State

**File:** `tests/home.spec.ts`

**Steps:**
  1. Add 2 items, open the menu, click Reset App State
    - expect: Cart badge disappears and localStorage 'cart-contents' is cleared
    - expect: KNOWN QUIRK: immediately after reset the buttons for the 2 added items still show 'Remove' and the menu stays open (verified live)
    - expect: After reloading the page all 6 buttons show 'Add to cart' and there is no badge

#### 5.4. HP-21 Menu: Logout and protected access

**File:** `tests/home.spec.ts`

**Steps:**
  1. Open the menu and click Logout (use a test that does not reuse the shared auth state file)
    - expect: Redirected to the login page at '/' with Username, Password and Login visible
  2. Navigate directly to /inventory.html
    - expect: Redirected to '/' with error "Epic sadface: You can only access '/inventory.html' when you are logged in."

#### 5.5. HP-22 Menu: About link

**File:** `tests/home.spec.ts`

**Steps:**
  1. Inspect the About link in the menu
    - expect: href is https://saucelabs.com/
    - expect: UNKNOWN: navigation was not clicked, so the destination page is unverified

#### 5.6. HP-23 Menu: Dynamic Catalog

**File:** `tests/home.spec.ts`

**Steps:**
  1. Open the menu and click Dynamic Catalog
    - expect: Item expands (aria expanded) revealing sub-buttons Lazy Load, Spinner and Slider; page stays on /inventory.html
    - expect: UNKNOWN: what each sub-item does or where it leads (not clicked); needs separate exploration
