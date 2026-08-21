import crypto from 'node:crypto'
import type { H3Event } from 'h3'
import type { Role, SessionUser } from '../../shared/types/api'

// Hashing helpers using node:crypto (scrypt)
export function hashUserPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyUserPassword(password: string, hashWithSalt: string): boolean {
  const parts = hashWithSalt.split(':')
  if (parts.length !== 2) return false
  const salt = parts[0]
  const hash = parts[1]
  if (!salt || !hash) return false
  const keyBuffer = Buffer.from(hash, 'hex')
  const matchBuffer = crypto.scryptSync(password, salt, 64)
  return crypto.timingSafeEqual(keyBuffer, matchBuffer)
}

// Session authorization helpers
export async function requireSession(event: H3Event) {
  const session = await getUserSession(event)
  const user = session.user as SessionUser | undefined
  if (!user || !user.id) {
    throw createApiError('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบก่อนดำเนินการ', 401)
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id, isActive: true },
    include: { organization: true },
  })

  if (!dbUser) {
    throw createApiError('UNAUTHORIZED', 'ไม่พบข้อมูลผู้ใช้งาน หรือบัญชีถูกระงับ', 401)
  }

  return dbUser
}

export async function requireRole(event: H3Event, ...roles: Role[]) {
  const dbUser = await requireSession(event)
  if (!roles.includes(dbUser.role as Role)) {
    throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์ในการดำเนินการนี้', 403)
  }
  return dbUser
}

export async function requireOwnership(event: H3Event, silkItemId: string, dbUser: SessionUser) {
  const silkItem = await prisma.silkItem.findUnique({
    where: { id: silkItemId },
  })

  if (!silkItem) {
    throw createApiError('NOT_FOUND', 'ไม่พบข้อมูลผ้าไหมที่ระบุ', 404)
  }

  if (silkItem.ownerUserId !== dbUser.id) {
    throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์ในการจัดการผ้าไหมรายการนี้', 403)
  }

  return silkItem
}
