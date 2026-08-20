import { expect, test, type Page } from '@playwright/test'

// dev mode ต้องรอ Vite โหลด module และ hydration เสร็จก่อน interact
// ไม่งั้น click จะโดนกลืนเพราะ SSR DOM ยังไม่มี event listener
const waitForHydration = (page: Page) => page.waitForLoadState('networkidle')

const signInAs = async (page: Page, roleLabel: string, homePath: string) => {
  await page.goto('/login')
  await waitForHydration(page)
  await page.getByRole('button', { name: new RegExp(roleLabel) }).click()
  await page.waitForURL(`**${homePath}`)
  await waitForHydration(page)
}

test('public home renders hero and top navigation', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 1 })).toContainText('ผ้าไหมทอมือบุรีรัมย์')
  await expect(page.getByRole('link', { name: 'ตรวจสอบใบรับรอง' }).first()).toBeVisible()
  await expect(page.getByRole('contentinfo')).toContainText('Local Simulation')
})

test('public navbar separates menu and auth zones', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)

  const banner = page.getByRole('banner')
  const nav = banner.getByRole('navigation', { name: 'เมนูหลัก' })
  await expect(nav.getByRole('link', { name: 'หน้าแรก' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'เข้าสู่ระบบ' })).toHaveCount(0)
  await expect(banner.getByRole('link', { name: 'เข้าสู่ระบบ' })).toBeVisible()
})

test('public navbar swaps login button for user menu after sign in', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')

  await page.goto('/')
  await waitForHydration(page)

  const banner = page.getByRole('banner')
  await expect(banner.getByRole('link', { name: 'เข้าสู่ระบบ' })).toHaveCount(0)
  await banner.getByRole('button', { name: 'เมนูผู้ใช้' }).click()
  await banner.getByRole('link', { name: 'หน้า Dashboard' }).click()
  await expect(page).toHaveURL(/\/weaver$/)
})

test('switching role from a public page navigates to the role dashboard', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')

  await page.goto('/ledger')
  await waitForHydration(page)

  await page.getByRole('button', { name: 'เมนูผู้ใช้' }).click()
  await page.getByRole('button', { name: 'ร้านค้า', exact: true }).click()
  await expect(page).toHaveURL(/\/transfers$/)
  await expect(page.getByRole('heading', { name: 'การส่งมอบ' })).toBeVisible()
})

test('user menu links to dashboard and public home', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')

  await page.getByRole('button', { name: 'เมนูผู้ใช้' }).click()
  await page.getByRole('link', { name: 'หน้าเว็บหลัก' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.getByRole('button', { name: 'เมนูผู้ใช้' }).click()
  await page.getByRole('link', { name: 'หน้า Dashboard' }).click()
  await expect(page).toHaveURL(/\/weaver$/)
})

test('public navigation reaches the about page', async ({ page }) => {
  await page.goto('/')
  await waitForHydration(page)
  await page.getByRole('navigation', { name: 'เมนูหลัก' }).getByRole('link', { name: 'ระบบทำงานอย่างไร' }).click()
  await expect(page.getByRole('heading', { name: 'ระบบทำงานอย่างไร' })).toBeVisible()
})

test('unauthenticated dashboard visit redirects to login', async ({ page }) => {
  await page.goto('/weaver')
  await expect(page).toHaveURL(/\/login$/)
})

test('dashboard layout renders sidebar and role-based menu', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')

  const sidebar = page.locator('aside[aria-label="เมนูหลัก"]')
  await expect(sidebar.getByRole('link', { name: 'ภาพรวม' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'ลงทะเบียนผ้าไหม' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'การส่งมอบ' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'คิวตรวจคำขอ' })).toHaveCount(0)

  await expect(page.getByRole('heading', { name: 'ภาพรวมช่างทอ' })).toBeVisible()
  await expect(page.getByText('ผู้ใช้ตัวอย่าง')).toBeVisible()
})

test('header user menu switches role, navigates to role home, and closes with Escape', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')

  const sidebar = page.locator('aside[aria-label="เมนูหลัก"]')
  await page.getByRole('button', { name: 'เมนูผู้ใช้' }).click()
  await page.getByRole('button', { name: 'ร้านค้า', exact: true }).click()
  await expect(page).toHaveURL(/\/transfers$/)
  await expect(sidebar.getByRole('link', { name: 'ลงทะเบียนผ้าไหม' })).toHaveCount(0)
  await expect(sidebar.getByRole('link', { name: 'การส่งมอบ' })).toBeVisible()

  await page.getByRole('button', { name: 'เมนูผู้ใช้' }).click()
  await page.getByRole('button', { name: 'เจ้าหน้าที่สหกรณ์', exact: true }).click()
  await expect(page).toHaveURL(/\/review$/)
  await expect(sidebar.getByRole('link', { name: 'คิวตรวจคำขอ' })).toBeVisible()

  await page.getByRole('button', { name: 'เมนูผู้ใช้' }).click()
  await expect(page.getByRole('button', { name: 'ออกจากระบบ' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'ออกจากระบบ' })).toBeHidden()
})

test('header toggle collapses and expands the sidebar on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signInAs(page, 'ช่างทอ', '/weaver')

  const sidebar = page.locator('aside[aria-label="เมนูหลัก"]')
  await expect(sidebar).toHaveCSS('width', '256px')

  await page.getByRole('button', { name: 'ยุบเมนูด้านข้าง' }).click()
  await expect(sidebar).toHaveCSS('width', '80px')
  await expect(sidebar.getByRole('link', { name: 'ลงทะเบียนผ้าไหม' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: 'ลงทะเบียนผ้าไหม' })).toHaveAttribute('title', 'ลงทะเบียนผ้าไหม')

  await page.getByRole('button', { name: 'ขยายเมนูด้านข้าง' }).click()
  await expect(sidebar).toHaveCSS('width', '256px')
})

test('sidebar highlights the longest matching menu item', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')

  const sidebar = page.locator('aside[aria-label="เมนูหลัก"]')
  await page.goto('/weaver/items/new')
  await expect(sidebar.getByRole('link', { name: 'ลงทะเบียนผ้าไหม' })).toHaveAttribute('aria-current', 'page')
  await expect(sidebar.getByRole('link', { name: 'ภาพรวม' })).not.toHaveAttribute('aria-current', 'page')

  await page.goto('/weaver/items/00000000-0000-0000-0000-000000000000')
  await expect(sidebar.getByRole('link', { name: 'ภาพรวม' })).toHaveAttribute('aria-current', 'page')
})

test('public detail and policy pages render their skeletons', async ({ page }) => {
  const cases: [string, string][] = [
    ['/certificate/BR-SILK-000001', 'รายละเอียดใบรับรอง'],
    ['/ledger/12', 'Block #12'],
    ['/privacy', 'นโยบายความเป็นส่วนตัว'],
  ]
  for (const [path, heading] of cases) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }

  await expect(page.getByRole('heading', { name: 'นโยบายความเป็นส่วนตัว' })).toBeVisible()
})

test('every authenticated page renders its skeleton', async ({ page }) => {  await signInAs(page, 'ช่างทอ', '/weaver')

  const cases: [string, string][] = [
    ['/weaver/items/new', 'ลงทะเบียนผ้าไหม'],
    ['/weaver/items/00000000-0000-0000-0000-000000000000', 'รายละเอียดผ้าไหม'],
    ['/review/00000000-0000-0000-0000-000000000000', 'ตรวจคำขอรับรอง'],
    ['/certificates/00000000-0000-0000-0000-000000000000/manage', 'จัดการใบรับรอง'],
    ['/transfers/00000000-0000-0000-0000-000000000000', 'รายละเอียดการส่งมอบ'],
    ['/audit/00000000-0000-0000-0000-000000000000', 'Audit Trail'],
  ]
  for (const [path, heading] of cases) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
})

test('login page lists actor roles and signs in to the role home', async ({ page }) => {
  await page.goto('/login')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible()
  await expect(page.getByRole('button', { name: /ช่างทอ/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'กลับหน้าแรก' })).toBeVisible()

  await page.getByRole('button', { name: /เจ้าหน้าที่สหกรณ์/ }).click()
  await expect(page).toHaveURL(/\/review$/)
  await expect(page.getByRole('heading', { name: 'คิวตรวจคำขอรับรอง' })).toBeVisible()
  await expect(
    page.locator('aside[aria-label="เมนูหลัก"]').getByRole('link', { name: 'คิวตรวจคำขอ' }),
  ).toBeVisible()

  // เข้าสู่ระบบแล้ว ไปที่ /login ต้องถูกพากลับไปหน้าหลักของบทบาท
  await page.goto('/login')
  await expect(page).toHaveURL(/\/review$/)
})

test('demo session persists across reload', async ({ page }) => {
  await signInAs(page, 'ร้านค้า', '/transfers')

  await page.reload()
  await expect(page).toHaveURL(/\/transfers$/)
  await expect(page.getByRole('button', { name: 'เมนูผู้ใช้' })).toBeVisible()
})

test('user menu sign out returns to the public home', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')

  await page.getByRole('button', { name: 'เมนูผู้ใช้' }).click()
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('banner').getByRole('link', { name: 'เข้าสู่ระบบ' })).toBeVisible()

  // ออกจากระบบแล้วเข้า dashboard ไม่ได้
  await page.goto('/weaver')
  await expect(page).toHaveURL(/\/login$/)
})

test('dashboard sidebar opens as drawer on narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 })
  await signInAs(page, 'ช่างทอ', '/weaver')

  const sidebar = page.locator('aside[aria-label="เมนูหลัก"]')
  await expect(sidebar).not.toBeInViewport()

  await page.getByRole('button', { name: 'เปิดเมนู' }).click()
  await expect(sidebar).toBeInViewport()
  await expect(sidebar.getByRole('link', { name: 'การส่งมอบ' })).toBeVisible()

  await page.getByRole('button', { name: 'ปิดเมนู' }).first().click()
  await expect(sidebar).not.toBeInViewport()
})
