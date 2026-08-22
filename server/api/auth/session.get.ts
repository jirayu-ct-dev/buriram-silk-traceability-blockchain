export default defineEventHandler(async (event) => {
  const dbUser = await requireSession(event)
  return {
    id: dbUser.id,
    displayName: dbUser.displayName,
    role: dbUser.role,
    organizationId: dbUser.organizationId ?? null,
    organizationName: dbUser.organization?.name || '',
  }
})
