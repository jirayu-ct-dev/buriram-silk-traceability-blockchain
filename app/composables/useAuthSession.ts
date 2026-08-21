import type { SessionUser, LoginInput } from '../../shared/types/api'

export const useAuthSession = () => {
  const user = useState<SessionUser | null>('auth-user', () => null)
  const loggedIn = computed(() => !!user.value)

  const fetchSession = async () => {
    try {
      const data = await $fetch<SessionUser>('/api/auth/session')
      user.value = data
    } catch {
      user.value = null
    }
  }

  const signIn = async (credentials: LoginInput) => {
    const data = await $fetch<SessionUser>('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })
    user.value = data
    return data
  }

  const signOut = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network errors on logout
    } finally {
      user.value = null
      await navigateTo('/')
    }
  }

  const homeFor = (role: string): string => {
    const HOME_BY_ROLE: Record<string, string> = {
      WEAVER: '/weaver',
      COOPERATIVE_OFFICER: '/review',
      STORE_USER: '/transfers',
    }
    return HOME_BY_ROLE[role] || '/'
  }

  return {
    user,
    loggedIn,
    fetch: fetchSession,
    signIn,
    signOut,
    homeFor,
  }
}
