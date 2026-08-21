export default defineEventHandler(async (event) => {
  const dbUser = await requireSession(event)
  return {
    id: dbUser.id,
    displayName: dbUser.displayName,
    role: dbUser.role,
    organizationName: dbUser.organization?.name || '',
  }
})
