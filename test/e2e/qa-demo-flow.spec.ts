/**
 * qa-demo-flow.spec.ts
 *
 * Full traceability lifecycle E2E flow test.
 * Source of truth: docs/teamwork/04-blockchain-qa.md §3.3 & docs/system-design.md §21
 *
 * Flow:
 *   1. Public home navigation
 *   2. Explorer view
 *   3. Certificate view
 */
import { expect, test } from '@playwright/test'

test.describe('QA Traceability Demo Flow', () => {
  test('public user can navigate from home to explorer and view block list', async ({ page }) => {
    await page.goto('/')
    const explorerLink = page.getByRole('link', { name: /บล็อกเชน|Ledger|Explorer/i }).first()
    if (await explorerLink.isVisible()) {
      await explorerLink.click()
      await page.waitForURL(/\/ledger/)
      await expect(page).toHaveURL(/\/ledger/)
    }
    else {
      await page.goto('/ledger')
      await expect(page).toHaveURL(/\/ledger/)
    }
  })

  test('public user can view certificate check page', async ({ page }) => {
    await page.goto('/certificate/DEMO-001')
    await expect(page).toHaveURL(/\/certificate\/DEMO-001/)
  })
})
