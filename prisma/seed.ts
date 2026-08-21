import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg' // Types resolved
import crypto from 'node:crypto'
import { seedLedger } from '../server/services/ledger.service'

const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function main() {
  console.log('🌱 Starting database seed...')

  const passwordHash = hashPassword('password')

  const coop = await prisma.organization.upsert({
    where: { id: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a' },
    update: {},
    create: {
      id: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
      name: 'สหกรณ์ทอผ้าไหมบุรีรัมย์จำกัด',
      type: 'COOPERATIVE',
    },
  })

  const store = await prisma.organization.upsert({
    where: { id: '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b' },
    update: {},
    create: {
      id: '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b',
      name: 'ร้านผ้าไหมบุรีรัมย์เซ็นเตอร์',
      type: 'STORE',
    },
  })

  const weaver = await prisma.user.upsert({
    where: { email: 'weaver1@example.com' },
    update: {},
    create: {
      id: '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c',
      email: 'weaver1@example.com',
      passwordHash,
      displayName: 'แม่ประนอม ไหมไทย',
      role: 'WEAVER',
      organizationId: coop.id,
    },
  })

  await prisma.weaverProfile.upsert({
    where: { userId: weaver.id },
    update: {},
    create: {
      userId: weaver.id,
      fullName: 'นางประนอม ไหมไทย',
      phone: '0812345678',
      address: '123 หมู่ 4 ต.บ้านใหม่ อ.เมือง จ.บุรีรัมย์',
    },
  })

  const officer = await prisma.user.upsert({
    where: { email: 'officer1@example.com' },
    update: {},
    create: {
      id: '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d',
      email: 'officer1@example.com',
      passwordHash,
      displayName: 'สมศักดิ์ ตรวจสอบ',
      role: 'COOPERATIVE_OFFICER',
      organizationId: coop.id,
    },
  })

  const storeUser = await prisma.user.upsert({
    where: { email: 'store1@example.com' },
    update: {},
    create: {
      id: '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e',
      email: 'store1@example.com',
      passwordHash,
      displayName: 'วิชัย ค้าขาย',
      role: 'STORE_USER',
      organizationId: store.id,
    },
  })

  try {
    await seedLedger(prisma)
    console.log('✅ Ledger seeded successfully.')
  } catch (err) {
    console.warn('⚠️ seedLedger call failed or not found, skipping. Details:', err)
  }

  const item1 = await prisma.silkItem.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      publicId: 'SI-111111',
      ownerUserId: weaver.id,
      custodianOrgId: coop.id,
    },
  })

  await prisma.silkItemRevision.upsert({
    where: { silkItemId_revisionNumber: { silkItemId: item1.id, revisionNumber: 1 } },
    update: {},
    create: {
      silkItemId: item1.id,
      revisionNumber: 1,
      status: 'DRAFT',
      title: 'ผ้าหางกระรอกสีแดงจำลอง',
      pattern: 'ลายหางกระรอก',
      material: 'ไหมแท้สาวมือ',
      technique: 'ทอมือ 2 ตะกอ',
      widthCm: 100,
      lengthCm: 200,
      productionDate: new Date(),
      notes: 'ทดสอบระบบแบบร่าง DRAFT',
    },
  })

  const item2 = await prisma.silkItem.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      publicId: 'SI-222222',
      ownerUserId: weaver.id,
      custodianOrgId: coop.id,
    },
  })

  const rev2 = await prisma.silkItemRevision.upsert({
    where: { silkItemId_revisionNumber: { silkItemId: item2.id, revisionNumber: 1 } },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222223',
      silkItemId: item2.id,
      revisionNumber: 1,
      status: 'SUBMITTED',
      title: 'ผ้าไหมมัดหมี่ลายขอพระราชทานจำลอง',
      pattern: 'ลายขอพระราชทาน',
      material: 'ไหมแท้เส้นยืนเส้นพุ่ง',
      technique: 'มัดหมี่ 3 ตะกอ',
      widthCm: 95,
      lengthCm: 180,
      productionDate: new Date(),
      notes: 'ทดสอบส่งคำขอตรวจสอบ SUBMITTED',
    },
  })

  await prisma.certificationRequest.upsert({
    where: { revisionId: rev2.id },
    update: {},
    create: {
      silkItemId: item2.id,
      revisionId: rev2.id,
      status: 'SUBMITTED',
      submittedByUserId: weaver.id,
    },
  })

  const item3 = await prisma.silkItem.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      publicId: 'SI-333333',
      ownerUserId: weaver.id,
      custodianOrgId: coop.id,
    },
  })

  const rev3 = await prisma.silkItemRevision.upsert({
    where: { silkItemId_revisionNumber: { silkItemId: item3.id, revisionNumber: 1 } },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333334',
      silkItemId: item3.id,
      revisionNumber: 1,
      status: 'APPROVED',
      title: 'ผ้าไหมลายโฮลโบราณจำลอง',
      pattern: 'ลายโฮลโบราณ',
      material: 'ไหมบ้านเส้นเล็กละเอียด',
      technique: 'ทอมือมัดหมี่โบราณ',
      widthCm: 102,
      lengthCm: 210,
      productionDate: new Date(),
      notes: 'ทดสอบใบรับรอง ACTIVE',
    },
  })

  await prisma.certificationRequest.upsert({
    where: { revisionId: rev3.id },
    update: {},
    create: {
      silkItemId: item3.id,
      revisionId: rev3.id,
      status: 'APPROVED',
      submittedByUserId: weaver.id,
      reviewedByUserId: officer.id,
      reviewedAt: new Date(),
    },
  })

  await prisma.certificate.upsert({
    where: { silkItemId: item3.id },
    update: {},
    create: {
      certificateCode: 'BR-SILK-333333',
      silkItemId: item3.id,
      revisionId: rev3.id,
      issuingOrgId: coop.id,
      issuedByUserId: officer.id,
      status: 'ACTIVE',
    },
  })

  const item4 = await prisma.silkItem.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      publicId: 'SI-444444',
      ownerUserId: weaver.id,
      custodianOrgId: coop.id,
    },
  })

  const rev4 = await prisma.silkItemRevision.upsert({
    where: { silkItemId_revisionNumber: { silkItemId: item4.id, revisionNumber: 1 } },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444445',
      silkItemId: item4.id,
      revisionNumber: 1,
      status: 'APPROVED',
      title: 'ผ้าไหมแก้วจำลองที่ถูกยกเลิก',
      pattern: 'ลายพื้นเมือง',
      material: 'ไหมผสมเส้นใยสังเคราะห์',
      technique: 'ทอเครื่องเชิงอุตสาหกรรม (ผิดสัญญาทอมือ)',
      widthCm: 100,
      lengthCm: 200,
      productionDate: new Date(),
      notes: 'ทดสอบใบรับรองถูก REVOKED ถาวร',
    },
  })

  await prisma.certificationRequest.upsert({
    where: { revisionId: rev4.id },
    update: {},
    create: {
      silkItemId: item4.id,
      revisionId: rev4.id,
      status: 'APPROVED',
      submittedByUserId: weaver.id,
      reviewedByUserId: officer.id,
      reviewedAt: new Date(),
    },
  })

  await prisma.certificate.upsert({
    where: { silkItemId: item4.id },
    update: {},
    create: {
      certificateCode: 'BR-SILK-444444',
      silkItemId: item4.id,
      revisionId: rev4.id,
      issuingOrgId: coop.id,
      issuedByUserId: officer.id,
      status: 'REVOKED',
      statusReason: 'ตรวจสอบพบการใช้ด้ายผสมไนลอนและทอด้วยเครื่องจักร ไม่ผ่านเกณฑ์มาตรฐานทอมือบุรีรัมย์',
      statusChangedAt: new Date(),
    },
  })

  await prisma.custodyTransfer.upsert({
    where: { id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1' },
    update: {},
    create: {
      id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
      silkItemId: item3.id,
      fromOrgId: coop.id,
      toOrgId: store.id,
      status: 'PENDING',
      initiatedByUserId: weaver.id,
    },
  })

  await prisma.custodyTransfer.upsert({
    where: { id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' },
    update: {},
    create: {
      id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
      silkItemId: item3.id,
      fromOrgId: coop.id,
      toOrgId: store.id,
      status: 'ACCEPTED',
      initiatedByUserId: weaver.id,
      resolvedByUserId: storeUser.id,
      resolvedAt: new Date(),
    },
  })

  console.log('🌱 Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
