import { Prisma } from '../../app/generated/prisma/client.js'
import type { AuditAction } from '../../app/generated/prisma/client.js'

interface AuditDbClient {
  auditLog: {
    create: (args: { data: Prisma.AuditLogUncheckedCreateInput }) => Promise<unknown>
  }
}

export async function createAuditLog(
  tx: AuditDbClient,
  silkItemId: string,
  action: AuditAction,
  actorUserId?: string,
  details?: Prisma.InputJsonValue
) {
  return await tx.auditLog.create({
    data: {
      silkItemId,
      action,
      actorUserId: actorUserId || null,
      details: details ?? Prisma.DbNull,
    },
  })
}
