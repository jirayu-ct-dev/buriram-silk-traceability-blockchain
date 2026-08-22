import type { OrganizationOption } from '../../../shared/types/api'

export default defineEventHandler(async (event) => {
  await requireSession(event)

  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      type: true,
    },
    orderBy: { name: 'asc' },
  })

  const list: OrganizationOption[] = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    type: org.type,
  }))

  return list
})
