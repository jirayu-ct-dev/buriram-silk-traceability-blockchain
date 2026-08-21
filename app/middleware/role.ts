export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch, homeFor } = useAuthSession()

  if (import.meta.client && !loggedIn.value) {
    await fetch()
  }

  if (!loggedIn.value || !user.value) {
    return navigateTo('/login')
  }

  const role = user.value.role

  if (to.path.startsWith('/weaver') && role !== 'WEAVER') {
    return navigateTo(homeFor(role))
  }

  if ((to.path.startsWith('/review') || to.path.startsWith('/certificates')) && role !== 'COOPERATIVE_OFFICER') {
    return navigateTo(homeFor(role))
  }
})
