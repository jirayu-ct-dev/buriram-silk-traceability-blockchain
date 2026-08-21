import { expect, test, type Page } from '@playwright/test'

const waitForHydration = (page: Page) => page.waitForLoadState('networkidle')

const signInAs = async (page: Page, roleLabel: string, homePath: string) => {
  await page.goto('/login')
  await waitForHydration(page)
  await page.getByRole('button', { name: new RegExp(roleLabel) }).click()
  await page.waitForURL(`**${homePath}`)
  await waitForHydration(page)
}

test('weaver can fill new silk item form and see success toast (Phase 1.4)', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')
  await page.goto('/weaver/items/new')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { name: 'ลงทะเบียนผ้าไหม' })).toBeVisible()

  // validation: empty title should show inline error after blur
  await page.getByLabel('ชื่อผืนผ้า').click()
  await page.getByLabel('ชื่อผืนผ้า').press('Tab')
  // no submit yet - fill valid data
  await page.getByLabel('ชื่อผืนผ้า').fill('ผ้าไหมทดสอบ E2E')
  await page.getByLabel('ลวดลาย').fill('มัดมี')
  await page.getByRole('button', { name: 'บันทึกร่าง' }).click()

  await expect(page.getByText('บันทึกร่างผ้าไหมสำเร็จ')).toBeVisible({ timeout: 5000 })
})

test('weaver DRAFT can submit for certification with confirm dialog', async ({ page }) => {
  await signInAs(page, 'ช่างทอ', '/weaver')
  await page.goto('/weaver/items/3')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'รายละเอียดผ้าไหม' })).toBeVisible()

  // wait for mock load
  await expect(page.getByText('ฉบับแก้ไขที่')).toBeVisible()
  const submitBtn = page.getByRole('button', { name: 'ส่งขอรับรอง' })
  await expect(submitBtn).toBeVisible()
  await submitBtn.click()

  // confirm dialog should appear
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('ยืนยันส่งขอรับรอง')).toBeVisible()

  // Escape should cancel
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(submitBtn).toBeVisible()

  // second time confirm
  await submitBtn.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'ส่งขอรับรอง' }).click()
  await expect(page.getByText('ส่งคำขอรับรองสำเร็จ')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('รอตรวจ')).toBeVisible()
})

test('review queue shows table and navigates to detail', async ({ page }) => {
  await signInAs(page, 'เจ้าหน้าที่สหกรณ์', '/review')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'คิวตรวจคำขอรับรอง' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByText('SI-001')).toBeVisible()
  await page.getByRole('link', { name: 'ตรวจ' }).first().click()
  await expect(page).toHaveURL(/\/review\/.+/)
  await expect(page.getByRole('heading', { name: 'ตรวจคำขอรับรอง' })).toBeVisible()
})

test('public cert NOT_FOUND shows correct hero (DoD)', async ({ page }) => {
  await page.goto('/verify')
  await waitForHydration(page)
  await page.getByLabel('Certificate ID').fill('BR-SILK-NOTFOUND-999')
  await page.getByRole('button', { name: 'ตรวจสอบ' }).click()
  await page.waitForURL('**/certificate/**')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'รายละเอียดใบรับรอง' })).toBeVisible()
  await expect(page.getByText('ไม่พบข้อมูล')).toBeVisible()
  await expect(page.getByText('ไม่พบใบรับรองนี้')).toBeVisible()

  // direct NOT_FOUND
  await page.goto('/certificate/UNKNOWN-CODE-123')
  await waitForHydration(page)
  await expect(page.getByText('ไม่พบข้อมูล')).toBeVisible()
})

test('verify page accepts ?code query param', async ({ page }) => {
  await page.goto('/verify?code=BR-SILK-001')
  await waitForHydration(page)
  await expect(page.getByLabel('Certificate ID')).toHaveValue('BR-SILK-001')
})

test('certificate manage revoke requires confirm with reason', async ({ page }) => {
  await signInAs(page, 'เจ้าหน้าที่สหกรณ์', '/review')
  await page.goto('/certificates/BR-SILK-001/manage')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'จัดการใบรับรอง' })).toBeVisible()

  const revokeBtn = page.getByRole('button', { name: /เพิกถอน/ })
  await expect(revokeBtn).toBeVisible()
  await revokeBtn.click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('เพิกถอน')).toBeVisible()

  // try confirm without reason -> should show error
  await dialog.getByRole('button', { name: 'เพิกถอน' }).click()
  await expect(dialog.getByText('กรุณาระบุเหตุผล')).toBeVisible()

  // Escape cancels and returns focus
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  // now with reason
  await revokeBtn.click()
  await expect(dialog).toBeVisible()
  await dialog.getByLabel(/เหตุผล/).fill('ทดสอบเพิกถอน E2E')
  await dialog.getByRole('button', { name: 'เพิกถอน' }).click()
  await expect(page.getByText('เพิกถอนสำเร็จ')).toBeVisible({ timeout: 5000 })
})

test('hash copy buttons are present and ledger verify badge shows', async ({ page }) => {
  await page.goto('/certificate/BR-SILK-001')
  await waitForHydration(page)
  await expect(page.getByLabel('คัดลอก hash')).toBeVisible()

  await page.goto('/ledger')
  await waitForHydration(page)
  await expect(page.getByText('Chain Integrity: ผ่าน')).toBeVisible()
  await expect(page.getByLabel('คัดลอก hash').first()).toBeVisible()

  await page.goto('/ledger/1')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: /Block #1/ })).toBeVisible()
  await expect(page.getByLabel('คัดลอก hash')).toBeVisible()
})
