import { expect, test } from '@playwright/test'

// dev mode ต้องรอ Vite โหลด module และ hydration เสร็จก่อน interact
// ไม่งั้น click จะโดนกลืนเพราะ SSR DOM ยังไม่มี event listener
const waitForHydration = (page: import('@playwright/test').Page) =>
  page.waitForLoadState('networkidle')

test('public home renders hero and top navigation', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 1 })).toContainText('ผ้าไหมทอมือบุรีรัมย์')
  await expect(page.getByRole('link', { name: 'ตรวจสอบใบรับรอง' }).first()).toBeVisible()
  await expect(page.getByRole('contentinfo')).toContainText('Local Simulation')
})

test('public navigation reaches the about page', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  await page.getByRole('navigation', { name: 'เมนูหลัก' }).getByRole('link', { name: 'ระบบทำงานอย่างไร' }).click()
  await expect(page.getByRole('heading', { name: 'ระบบทำงานอย่างไร' })).toBeVisible()
})

test('dashboard layout renders sidebar and role-based menu', async ({ page }) => {
  await page.goto('/weaver')

  const sidebar = page.locator('aside[aria-label="เมนูหลัก"]')
  await expect(sidebar.getByRole('link', { name: 'ภาพรวม' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'การส่งมอบ' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'คิวตรวจคำขอ' })).toHaveCount(0)

  await expect(page.getByRole('heading', { name: 'ภาพรวมช่างทอ' })).toBeVisible()
  await expect(page.getByText('ผู้ใช้ตัวอย่าง')).toBeVisible()
})

test('dashboard sidebar opens as drawer on narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 })
  await page.goto('/weaver')
  await waitForHydration(page)

  const sidebar = page.locator('aside[aria-label="เมนูหลัก"]')
  await expect(sidebar).not.toBeInViewport()

  await page.getByRole('button', { name: 'เปิดเมนู' }).click()
  await expect(sidebar).toBeInViewport()
  await expect(sidebar.getByRole('link', { name: 'การส่งมอบ' })).toBeVisible()

  await page.getByRole('button', { name: 'ปิดเมนู' }).first().click()
  await expect(sidebar).not.toBeInViewport()
})
