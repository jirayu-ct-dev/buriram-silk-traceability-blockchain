import { markRaw, type Component } from 'vue'
import { ArrowLeftRight, ClipboardList, LayoutDashboard } from '@lucide/vue'

export type DashboardRole = 'WEAVER' | 'COOPERATIVE_OFFICER' | 'STORE_USER'

export interface DashboardNavItem {
  label: string
  to: string
  icon: Component
}

// เมนูแยกตาม role ตาม system-design.md §5.2
// เพิ่มเมนูได้เมื่อหน้าปลายทางมีจริงเท่านั้น (ไม่แสดง dead menu)
const NAV_BY_ROLE: Record<DashboardRole, DashboardNavItem[]> = {
  WEAVER: [
    { label: 'ภาพรวม', to: '/weaver', icon: markRaw(LayoutDashboard) },
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

export const useDashboardNav = () => ({
  navFor: (role: DashboardRole): DashboardNavItem[] => NAV_BY_ROLE[role],
})
