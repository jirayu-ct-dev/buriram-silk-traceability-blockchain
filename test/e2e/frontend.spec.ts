import { expect, test, type Page } from '@playwright/test'

const waitForHydration = (page: Page) => page.waitForLoadState('networkidle')

const signInAs = async (page: Page, roleLabel: string, homePath: string) => {
  await page.goto('/login')
  await waitForHydration(page)
  await page.getByRole('button', { name: new RegExp(roleLabel) }).click()
  await page.waitForURL(`**${homePath}`)
  await waitForHydration(page)
}

const PNG_BUFFER = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

const createDraftItem = async (page: Page, title: string, withEvidence = false) => {
  await page.goto('/weaver/items/new')
  await waitForHydration(page)

  await page.getByLabel('ชื่อผืนผ้า').fill(title)
  await page.getByLabel('ลวดลาย').fill('มัดมี E2E')

  if (withEvidence) {
    await page.getByLabel('เลือกไฟล์หลักฐาน').setInputFiles({
      name: `evidence-${Date.now()}.png`,
      mimeType: 'image/png',
      buffer: PNG_BUFFER,
    })
  }

  const createResponsePromise = page.waitForResponse(
    res => res.request().method() === 'POST' && new URL(res.url()).pathname === '/api/silk-items',
    { timeout: 10_000 },
  )
  const evidenceResponsePromise = withEvidence
    ? page.waitForResponse(res => res.request().method() === 'POST' && res.url().includes('/evidence'), { timeout: 10_000 })
    : null

  await page.getByRole('button', { name: 'บันทึกร่าง', exact: true }).click()

  const createResponse = await createResponsePromise
  expect(createResponse.status()).toBe(200)
  const created = (await createResponse.json()) as { id: string, publicId: string }

  if (evidenceResponsePromise) {
    const evidenceResponse = await evidenceResponsePromise
    expect(evidenceResponse.status()).toBe(200)
  }

  await page.waitForURL(/\/weaver$/)
  await waitForHydration(page)

  return created
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
  await expect(page.getByText('รอตรวจ').first()).toBeVisible()
})

test('review queue shows table and navigates to detail', async ({ page }) => {
  await signInAs(page, 'เจ้าหน้าที่สหกรณ์', '/review')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'คิวตรวจคำขอรับรอง' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByText('SI-001')).toBeVisible()
  await page.getByRole('link', { name: 'ตรวจ', exact: true }).first().click()
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
  await expect(page.getByText('ไม่พบใบรับรองนี้', { exact: true })).toBeVisible()

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
  await expect(dialog.getByRole('heading', { name: 'ยืนยันเพิกถอนใบรับรอง' })).toBeVisible()

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

test('weaver can edit a DRAFT silk item and save changes', async ({ page }) => {
  const runId = Date.now().toString(36)
  const initialTitle = `ผ้าไหม E2E แก้ไข ${runId}`

  await signInAs(page, 'ช่างทอ', '/weaver')
  const created = await createDraftItem(page, initialTitle)

  await page.goto(`/weaver/items/${created.id}/edit`)
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'แก้ไขผ้าไหม' })).toBeVisible()
  await expect(page.getByLabel('ชื่อผืนผ้า')).toHaveValue(initialTitle)

  const updatedTitle = `${initialTitle} (แก้ไข)`
  await page.getByLabel('ชื่อผืนผ้า').fill(updatedTitle)
  await page.getByLabel('หมายเหตุ').fill('หมายเหตุดัวย E2E')

  const patchResponsePromise = page.waitForResponse(
    res => res.request().method() === 'PATCH' && res.url().includes(`/api/silk-items/${created.id}`),
    { timeout: 10_000 },
  )
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click()
  const patchResponse = await patchResponsePromise
  expect(patchResponse.status()).toBe(200)

  await expect(page.getByText('บันทึกข้อมูลผ้าไหมสำเร็จ')).toBeVisible()
  await page.waitForURL(/\/weaver\/items\/[^/]+$/)
  await waitForHydration(page)
  await expect(page.getByText(updatedTitle)).toBeVisible()
})

test('weaver can resubmit a rejected silk item, edit the new DRAFT, and save evidence', async ({ page }) => {
  const runId = Date.now().toString(36)
  const title = `ผ้าไหม E2E Resubmit ${runId}`

  await signInAs(page, 'ช่างทอ', '/weaver')
  const created = await createDraftItem(page, title, true)

  await page.goto(`/weaver/items/${created.id}`)
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'รายละเอียดผ้าไหม' })).toBeVisible()
  await expect(page.getByText('ฉบับแก้ไขที่ 1')).toBeVisible()

  const submitResponsePromise = page.waitForResponse(
    res => res.request().method() === 'POST' && res.url().includes('/submit'),
    { timeout: 10_000 },
  )
  await page.getByRole('button', { name: 'ส่งขอรับรอง' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'ส่งขอรับรอง' }).click()
  const submitResponse = await submitResponsePromise
  expect(submitResponse.status()).toBe(200)
  await expect(page.getByText('ส่งคำขอรับรองสำเร็จ')).toBeVisible()
  await expect(page.getByText('รอตรวจ').first()).toBeVisible()

  await page.goto(`/weaver/items/${created.id}/edit`)
  await waitForHydration(page)
  await expect(page.getByText('ไม่สามารถแก้ไขรายการนี้')).toBeVisible()

  await page.context().clearCookies()
  await signInAs(page, 'เจ้าหน้าที่สหกรณ์', '/review')
  await page.getByLabel('ค้นหาคำขอ').fill(title)
  await expect(page.getByRole('table')).toBeVisible()
  await page.getByRole('link', { name: 'ตรวจ', exact: true }).first().click()
  await waitForHydration(page)
  await expect(page.getByRole('heading', { name: 'ตรวจคำขอรับรอง' })).toBeVisible()
  await expect(page.getByText(title)).toBeVisible()

  await page.getByLabel(/เหตุผล/).selectOption({ label: 'หลักฐานไม่ครบถ้วน' })
  await page.getByLabel(/บันทึกการตรวจ/).fill('ปฏิเสธดวย E2E')

  const rejectResponsePromise = page.waitForResponse(
    res => res.request().method() === 'POST' && res.url().includes('/reject'),
    { timeout: 10_000 },
  )
  await page.getByRole('button', { name: 'ปฏิเสธ', exact: true }).click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'ปฏิเสธ', exact: true }).click()
  const rejectResponse = await rejectResponsePromise
  expect(rejectResponse.status()).toBe(200)

  await page.waitForURL(/\/review$/)
  await waitForHydration(page)
  await expect(page.getByText('ปฏิเสธคำขอแลว')).toBeVisible()

  await page.context().clearCookies()
  await signInAs(page, 'ช่างทอ', '/weaver')
  await page.goto(`/weaver/items/${created.id}`)
  await waitForHydration(page)
  await expect(page.getByText('ถูกปฏิเสธ').first()).toBeVisible()

  const resubmitResponsePromise = page.waitForResponse(
    res => res.request().method() === 'POST' && res.url().includes('/revisions'),
    { timeout: 10_000 },
  )
  await page.getByRole('button', { name: 'สร้างฉบับแก้ใหม่และส่งใหม่' }).click()
  const resubmitResponse = await resubmitResponsePromise
  expect(resubmitResponse.status()).toBe(200)

  await page.waitForURL(/\/weaver\/items\/[^/]+\/edit$/)
  await waitForHydration(page)
  await expect(page.getByText('สร้างฉบับแก้ใหม่สำเร็จ')).toBeVisible()
  await expect(page.getByLabel('ชื่อผืนผ้า')).toHaveValue(title)

  const updatedTitle = `${title} (ฉบับแก้ไข)`
  const updatedNotes = 'แก้ไขหลังปฏิเสธ E2E'
  const evidenceFileName = `resubmit-evidence-${runId}.png`

  await page.getByLabel('ชื่อผืนผ้า').fill(updatedTitle)
  await page.getByLabel('หมายเหตุ').fill(updatedNotes)
  await page.getByLabel('เลือกไฟล์หลักฐาน').setInputFiles({
    name: evidenceFileName,
    mimeType: 'image/png',
    buffer: PNG_BUFFER,
  })

  const patchResponsePromise = page.waitForResponse(
    res => res.request().method() === 'PATCH' && res.url().includes(`/api/silk-items/${created.id}`),
    { timeout: 10_000 },
  )
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click()
  const patchResponse = await patchResponsePromise
  expect(patchResponse.status()).toBe(200)

  await expect(page.getByText('บันทึกข้อมูลผ้าไหมสำเร็จ')).toBeVisible()
  await page.waitForURL(/\/weaver\/items\/[^/]+$/)
  await waitForHydration(page)
  await expect(page.getByText('ฉบับแก้ไขที่ 2')).toBeVisible()
  await expect(page.getByText(updatedTitle)).toBeVisible()
  await expect(page.getByText(updatedNotes)).toBeVisible()
  await expect(page.getByText('หลักฐานประกอบ (1)')).toBeVisible()
  await expect(page.getByText(evidenceFileName)).toBeVisible()
})
