import type { DashboardRole } from '~/composables/useDashboardNav'

// TODO(auth): แทนด้วย session จริงหลัง implement Phase Auth/RBAC
// เก็บบทบาท demo ไว้ใน cookie เพื่อจำลอง session ข้าม refresh
// null = ยังไม่ได้เข้าสู่ระบบ
export const useDemoRole = () => useCookie<DashboardRole | null>('demo-role', { default: () => null })
