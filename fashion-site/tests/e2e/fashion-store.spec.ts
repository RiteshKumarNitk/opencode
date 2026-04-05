import { test, expect } from '@playwright/test'

test.describe('Fashion Store E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('homepage loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Fashion/i)
    await expect(page.locator('text=myntra')).toBeVisible()
  })

  test('can navigate to products page', async ({ page }) => {
    await page.click('text=Men')
    await expect(page).toHaveURL(/products/)
  })

  test('search functionality works', async ({ page }) => {
    await page.fill('input[type="text"]', 'shirt')
    await page.press('input[type="text"]', 'Enter')
    await expect(page).toHaveURL(/search=shirt/)
  })

  test('cart functionality', async ({ page }) => {
    await page.goto('/products')
    const addToCartButtons = page.locator('button:has-text("Add to Cart")')
    if (await addToCartButtons.first().isVisible()) {
      await addToCartButtons.first().click()
      await expect(page.locator('.bg-\\[\\#ff3f6c\\]')).toBeVisible()
    }
  })

  test('can navigate to login page', async ({ page }) => {
    await page.click('text=Login')
    await expect(page).toHaveURL(/login/)
    await expect(page.locator('text=Email')).toBeVisible()
  })

  test('can navigate to cart page', async ({ page }) => {
    await page.click('text=Bag')
    await expect(page).toHaveURL(/cart/)
  })

  test('footer links are visible', async ({ page }) => {
    await expect(page.locator('text=Contact Us')).toBeVisible()
    await expect(page.locator('text=Privacy Policy')).toBeVisible()
  })
})

test.describe('Product Details', () => {
  test('can view product details', async ({ page }) => {
    await page.goto('/products')
    const firstProduct = page.locator('a[href*="/products/"]').first()
    if (await firstProduct.isVisible()) {
      await firstProduct.click()
      await expect(page.locator('text=Add to Cart')).toBeVisible()
    }
  })
})

test.describe('Authentication', () => {
  test('login form validation', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Login")')
    await expect(page.locator('text=Email is required')).toBeVisible()
  })

  test('registration form validation', async ({ page }) => {
    await page.goto('/register')
    await page.click('button:has-text("Register")')
    await expect(page.locator('text=Email is required')).toBeVisible()
  })
})

test.describe('Checkout Flow', () => {
  test('checkout page loads', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.locator('text=Shipping Address')).toBeVisible()
  })
})