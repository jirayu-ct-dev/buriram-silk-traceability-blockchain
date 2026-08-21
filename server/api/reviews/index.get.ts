import type { ReviewQueueItem } from '../../../shared/types/api'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'COOPERATIVE_OFFICER')

  const requests = await prisma.certificationRequest.findMany({
    where: { status: 'SUBMITTED' },
    include: {
      silkItem: true,
      revision: true,
      submittedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const queue: ReviewQueueItem[] = requests.map((req) => ({
    requestId: req.id,
    silkItemPublicId: req.silkItem.publicId,
    revisionTitle: req.revision.title,
    submittedBy: req.submittedBy.displayName,
    submittedAt: req.createdAt.toISOString(),
  }))

  return queue
})
