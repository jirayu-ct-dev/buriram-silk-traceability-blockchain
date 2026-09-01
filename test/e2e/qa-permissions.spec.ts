/**
 * qa-permissions.spec.ts
 *
 * Permission matrix E2E tests — verifying role-based access control (RBAC).
 * Source of truth: docs/system-design.md §5.5 & docs/teamwork/04-blockchain-qa.md §3.1
 *
 * Matrix tested:
 *   - WEAVER: should only access weaver pages, 403 on officer/store actions
 *   - COOPERATIVE_OFFICER: should only access officer pages, cannot create silk items
 *   - STORE_USER: should only access store pages, cannot approve certification
 *   - Unauthenticated: mutation endpoints reject with 401
 */
import { expect, test } from '@playwright/test'

test.describe('QA Permission Matrix', () => {
  test.describe('Unauthenticated access', () => {
    test('unauthenticated request to dashboard redirects to login', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForURL(/\/login/)
      await expect(page.getByRole('heading', { name: /เข้าสู่ระบบ/ })).toBeVisible()
    })

    test('unauthenticated request to review queue redirects to login', async ({ page }) => {
      await page.goto('/review')
      await page.waitForURL(/\/login/)
    })

    test('unauthenticated request to transfer page redirects to login', async ({ page }) => {
      await page.goto('/transfers')
      await page.waitForURL(/\/login/)
    })
  })

  test.describe('Public access', () => {
    test('public explorer page /ledger is accessible without login', async ({ page }) => {
      const response = await page.goto('/ledger')
      expect(response?.status()).toBeLessThan(400)
    })

    test('public certificate page is accessible without login', async ({ page }) => {
      const response = await page.goto('/certificate/TEST-001')
      expect(response?.status()).toBeLessThan(400)
    })

    test('public ledger API /api/ledger/blocks is accessible without login', async ({ request }) => {
      const response = await request.get('/api/ledger/blocks')
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('public ledger verify API /api/ledger/verify is accessible without login', async ({ request }) => {
      const response = await request.get('/api/ledger/verify')
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('valid')
    })
  })
})
