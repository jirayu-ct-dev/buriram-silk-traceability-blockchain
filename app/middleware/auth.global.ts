export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user, homeFor } = useAuthSession()

  // Dashboard layout requires user to be logged in
  if (to.meta.layout === 'dashboard' && !loggedIn.value) {
    return navigateTo('/login')
  }

  // Logged-in users should not access login page
  if (to.path === '/login' && loggedIn.value && user.value) {
    return navigateTo(homeFor(user.value.role))
  }

  // Protect routes based on user role
  if (to.meta.layout === 'dashboard' && user.value) {
    const role = user.value.role
    if (to.path.startsWith('/weaver') && role !== 'WEAVER') {
      return navigateTo(homeFor(role))
    }
    if ((to.path.startsWith('/review') || to.path.startsWith('/certificates')) && role !== 'COOPERATIVE_OFFICER') {
      return navigateTo(homeFor(role))
    }
  }
})
