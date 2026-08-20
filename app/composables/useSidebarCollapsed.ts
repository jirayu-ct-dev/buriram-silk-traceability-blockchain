// สถานะยุบ/ขยาย sidebar ใช้ร่วมกันระหว่าง sidebar, header และ layout
// เพื่อให้ width ของ sidebar และ padding ของ content อ้างอิงค่าเดียวกัน
export const useSidebarCollapsed = () => useState('sidebar-collapsed', () => false)
