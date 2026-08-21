export default defineNuxtPlugin(async (_nuxtApp) => {
  const { user } = useUserSession()
  const authSession = useAuthSession()

  // Sync nuxt-auth-utils session user to custom authSession user state
  // on both server-side and client-side during initialization.
  if (user.value) {
    const rawUser = user.value as unknown as {
      id: string
      displayName: string
      role: 'WEAVER' | 'COOPERATIVE_OFFICER' | 'STORE_USER'
      organizationName?: string
    }
    authSession.user.value = {
      id: rawUser.id,
      displayName: rawUser.displayName,
      role: rawUser.role,
      organizationName: rawUser.organizationName || '',
    }
  }
})
