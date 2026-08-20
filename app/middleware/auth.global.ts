// TODO(auth): demo guard — แทนด้วยการตรวจ session จริงหลัง implement Phase Auth/RBAC
export default defineNuxtRouteMiddleware((to) => {
  const role = useDemoRole()

  // หน้า dashboard ต้องเข้าสู่ระบบก่อน
  if (to.meta.layout === 'dashboard' && !role.value) {
    return navigateTo('/login')
  }

  // เข้าสู่ระบบแล้วไม่ต้องเห็นหน้า login อีก
  if (to.path === '/login' && role.value) {
    return navigateTo(useDashboardNav().homeFor(role.value))
  }
})
