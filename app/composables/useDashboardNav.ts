import { markRaw, type Component } from 'vue'
import { ArrowLeftRight, ClipboardList, FilePlus2, LayoutDashboard } from '@lucide/vue'

export type DashboardRole = 'WEAVER' | 'COOPERATIVE_OFFICER' | 'STORE_USER'

export interface DashboardNavItem {
  label: string
  to: string
  icon: Component
}

// เมนูแยกตาม role ตาม system-design.md §5.2
// หน้า detail (เช่น /review/:id) เข้าถึงจากรายการ ไม่อยู่ในเมนู
const NAV_BY_ROLE: Record<DashboardRole, DashboardNavItem[]> = {
  WEAVER: [
    { label: 'ภาพรวม', to: '/weaver', icon: markRaw(LayoutDashboard) },
    { label: 'ลงทะเบียนผ้าไหม', to: '/weaver/items/new', icon: markRaw(FilePlus2) },
    { label: 'การส่งมอบ', to: '/transfers', icon: markRaw(ArrowLeftRight) },
  ],
  COOPERATIVE_OFFICER: [
    { label: 'คิวตรวจคำขอ', to: '/review', icon: markRaw(ClipboardList) },
    { label: 'การส่งมอบ', to: '/transfers', icon: markRaw(ArrowLeftRight) },
  ],
  STORE_USER: [
    { label: 'การส่งมอบ', to: '/transfers', icon: markRaw(ArrowLeftRight) },
  ],
}

// หน้าแรกของแต่ละ role หลังเข้าสู่ระบบ
const HOME_BY_ROLE: Record<DashboardRole, string> = {
  WEAVER: '/weaver',
  COOPERATIVE_OFFICER: '/review',
  STORE_USER: '/transfers',
}

export const useDashboardNav = () => ({
  navFor: (role: DashboardRole): DashboardNavItem[] => NAV_BY_ROLE[role],
  homeFor: (role: DashboardRole): string => HOME_BY_ROLE[role],
})
