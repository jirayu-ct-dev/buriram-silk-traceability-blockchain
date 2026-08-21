import 'dotenv/config'
import { describe, it, expect, beforeAll } from 'vitest'
import { PrismaClient } from '../../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg' // Types resolved
import crypto from 'node:crypto'
import { hashUserPassword, verifyUserPassword } from '../../server/utils/auth'
import { appendEvents } from '../../server/services/ledger.service'

const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ทดสอบได้แม้ DB ยังไม่ seed — ถ้าไม่มี organization เลยให้สร้างขึ้นมาใหม่
// (การใช้ random UUID ตรง ๆ จะทำให้ FK ของ users.organization_id พัง)
const ensureTestOrg = async () => {
  const existing = await prisma.organization.findFirst()
  if (existing) return existing.id
  const created = await prisma.organization.create({
    data: { name: 'Test Organization', type: 'COOPERATIVE' },
  })
  return created.id
}

describe('Backend Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  describe('Password Hashing', () => {
    it('should correctly hash and verify passwords using scrypt', () => {
      const password = 'mySecretPassword'
      const hashed = hashUserPassword(password)

      expect(hashed).toContain(':')
      expect(verifyUserPassword(password, hashed)).toBe(true)
      expect(verifyUserPassword('wrongPassword', hashed)).toBe(false)
    })
  })

  describe('Revision States & Business Rules', () => {
    it('should enforce editing only DRAFT revisions and rollback on violations', async () => {
      const testWeaverId = 'weaver-' + Math.random().toString(36).substring(2, 7)
      const testItemId = crypto.randomUUID()
      const testRevId = crypto.randomUUID()

      const orgId = await ensureTestOrg()

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: crypto.randomUUID(),
            email: `${testWeaverId}@test.com`,
            passwordHash: 'dummy',
            displayName: 'Test Weaver',
            role: 'WEAVER',
            organizationId: orgId,
          },
        })

        const item = await tx.silkItem.create({
          data: {
            id: testItemId,
            publicId: 'SI-TEST1',
            ownerUserId: user.id,
            custodianOrgId: orgId,
          },
        })

        const rev = await tx.silkItemRevision.create({
          data: {
            id: testRevId,
            silkItemId: item.id,
            revisionNumber: 1,
            status: 'DRAFT',
            title: 'Draft Silk',
          },
        })

        const updated = await tx.silkItemRevision.update({
          where: { id: rev.id },
          data: { title: 'Updated Draft' },
        })
        expect(updated.title).toBe('Updated Draft')

        await tx.silkItemRevision.update({
          where: { id: rev.id },
          data: { status: 'SUBMITTED' },
        })

        const checkRev = await tx.silkItemRevision.findUnique({
          where: { id: rev.id },
        })

        expect(checkRev?.status).toBe('SUBMITTED')

        throw new Error('Rollback intentional after check')
      }).catch((err) => {
        expect(err.message).toBe('Rollback intentional after check')
      })

      const checkCleaned = await prisma.silkItem.findUnique({
        where: { id: testItemId },
      })
      expect(checkCleaned).toBeNull()
    })
  })

  describe('Approve & Ledger Block Atomic Transaction', () => {
    it('should link approve and ledger blocks atomically, rollback both if block fails', async () => {
      const testItemId = crypto.randomUUID()
      const testRevId = crypto.randomUUID()
      const testReqId = crypto.randomUUID()

      const orgId = await ensureTestOrg()

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: crypto.randomUUID(),
            email: `weaver-happy@test.com`,
            passwordHash: 'dummy',
            displayName: 'Test Weaver',
            role: 'WEAVER',
            organizationId: orgId,
          },
        })

        const item = await tx.silkItem.create({
          data: {
            id: testItemId,
            publicId: 'SI-HAPPY',
            ownerUserId: user.id,
            custodianOrgId: orgId,
          },
        })

        const rev = await tx.silkItemRevision.create({
          data: {
            id: testRevId,
            silkItemId: item.id,
            revisionNumber: 1,
            status: 'SUBMITTED',
            title: 'Submitted Silk',
          },
        })

        const request = await tx.certificationRequest.create({
          data: {
            id: testReqId,
            silkItemId: item.id,
            revisionId: rev.id,
            status: 'SUBMITTED',
            submittedByUserId: user.id,
          },
        })

        await tx.certificationRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED' },
        })

        await tx.certificate.create({
          data: {
            certificateCode: 'BR-SILK-HAPPY',
            silkItemId: item.id,
            revisionId: rev.id,
            issuingOrgId: orgId,
            issuedByUserId: user.id,
            status: 'ACTIVE',
          },
        })

        const result = await appendEvents(tx, [
          {
            eventType: 'ISSUE_CERTIFICATE',
            aggregateId: item.publicId,
            actorId: user.id,
            payload: { certificateCode: 'BR-SILK-HAPPY', revisionNumber: 1 },
          },
        ])

        expect(result.blockIndex).toBeGreaterThan(0)
        expect(result.blockHash).toBeDefined()

        throw new Error('Cleanup rollback')
      }).catch((err) => {
        expect(err.message).toBe('Cleanup rollback')
      })
    })

    it('should verify rollback of certificate creation if ledger service throws an error', async () => {
      const testItemId = crypto.randomUUID()
      const testRevId = crypto.randomUUID()

      const orgId = await ensureTestOrg()

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: crypto.randomUUID(),
            email: `weaver-fail@test.com`,
            passwordHash: 'dummy',
            displayName: 'Test Weaver',
            role: 'WEAVER',
            organizationId: orgId,
          },
        })

        const item = await tx.silkItem.create({
          data: {
            id: testItemId,
            publicId: 'SI-FAIL',
            ownerUserId: user.id,
            custodianOrgId: orgId,
          },
        })

        const rev = await tx.silkItemRevision.create({
          data: {
            id: testRevId,
            silkItemId: item.id,
            revisionNumber: 1,
            status: 'SUBMITTED',
            title: 'Submitted Silk',
          },
        })

        await tx.certificate.create({
          data: {
            certificateCode: 'BR-SILK-FAIL',
            silkItemId: item.id,
            revisionId: rev.id,
            issuingOrgId: orgId,
            issuedByUserId: user.id,
            status: 'ACTIVE',
          },
        })

        throw new Error('Ledger block production failed!')
      }).catch((err) => {
        expect(err.message).toBe('Ledger block production failed!')
      })

      const checkCert = await prisma.certificate.findFirst({
        where: { certificateCode: 'BR-SILK-FAIL' },
      })
      expect(checkCert).toBeNull()
    })
  })
})
