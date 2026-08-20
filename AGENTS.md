# AGENTS.md

คู่มือพฤติกรรมสำหรับ AI agent ที่ทำงานกับโปรเจกต์นี้ — จะถูกอ่านทุกครั้งที่เริ่มงาน ให้ปฏิบัติตามอย่างเคร่งครัด

## 0. กฎเหล็ก

- **ก่อนแก้ไขหรือสร้างโค้ดทุกครั้ง ต้องโหลด skill `web-ui-coding-standards`** (ด้วย skill tool) แล้วทำตามมาตรฐานนั้น — เพื่อให้ style ของทุกคนในทีมเหมือนกัน ทั้ง Vue component, Tailwind, form, table, toast และ Docker
- ภาษาของ UI และข้อความต่อผู้ใช้คือ **ภาษาไทย**; ชื่อตัวแปร/ฟังก์ชัน/ไฟล์เป็นภาษาอังกฤษ
- **ห้าม commit/push/แก้ git history เอง** เว้นแต่ผู้ใช้สั่งชัดเจน
- ห้ามแตะ: `.env`, `storage/`, private key, `app/generated/` (Prisma client ที่ generate อัตโนมัติ)
- จบงานทุกครั้งด้วย gates: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` — ทุกอย่างต้องผ่านก่อนส่งมอบ

## 1. โปรเจกต์นี้คืออะไร

เว็บแอป Nuxt 4 full-stack สำหรับรับรองแหล่งที่มาผ้าไหมทอมือบุรีรัมย์ พร้อม **Local Blockchain Simulation** (SHA-256 Hash Chain + Proof of Authority + Ed25519 — ไม่ใช่ network จริง) มี 3 actor: ช่างทอ · เจ้าหน้าที่สหกรณ์ · ร้านค้า และหน้า public สำหรับผู้บริโภค

- **Source of truth:** `docs/system-design.md` (routes §5, workflow §6, ledger §8, build order §19) · `docs/database-design.md` — ทำตามนี้ก่อนตามความเห็นตัวเองเสมอ
- โครงหน้า (17 route) ครบแล้วใน `app/pages/` — ส่วนใหญ่เป็น skeleton รอ phase ต่อไป (ดู TODO ในแต่ละไฟล์)
- ฐานข้อมูล: Prisma 7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL 17 — 14 ตาราง, ledger เป็น append-only (บังคับด้วย DB trigger), custody มี partial unique index

## 2. คำสั่งและ Ports

| งาน | คำสั่ง |
|---|---|
| Dev server (http://localhost:3007) | `pnpm dev` (ต้องมี postgres: `docker compose up -d postgres`) |
| รันทั้งระบบด้วย Docker คำสั่งเดียว | `docker compose up -d --build` (postgres → migrate → app) |
| Type check / Lint / Unit / E2E | `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm test:e2e` |
| Migration ใหม่ | `pnpm db:migrate` |

- **App: port 3007** · **PostgreSQL (host): port 5437** — เลี่ยงชนโปรเจกต์อื่นบนเครื่อง ห้ามใช้ 3000/5432
- ภายใน docker network ของ compose เรียก DB ที่ `postgres:5432` (ไม่ใช่ host port)

## 3. Conventions ที่ต้องรักษา

- **สี:** ใช้ semantic token จาก `app/app.config.ts` เท่านั้น (`bg-primary`, `text-error-700`) — ห้าม hard-code palette (`amber-600`) ใน template; ค่า map ผ่าน `--ui-*` vars + `@theme inline` ใน `main.css`
- **ชื่อ component:** ตาม path prefix เช่น `app/components/ui/AppSidebar.vue` → `<UiAppSidebar>`
- **Icons:** `@lucide/vue` เท่านั้น; ปุ่ม icon-only ต้องมี `aria-label`
- **Feedback:** ใช้ `useToast()` / `useConfirm()` ของโปรเจกต์ — ห้าม `alert()`/`confirm()` ของ browser
- **เมนู sidebar:** แสดงเฉพาะหน้าที่มีจริง (ไม่มี dead menu); แยกตาม role ที่ `useDashboardNav.ts`
- **Auth (ชั่วคราว):** role demo เก็บใน cookie ผ่าน `useDemoRole()` + guard ที่ `app/middleware/auth.global.ts` — จะถูกแทนด้วย session จริงใน Phase Auth/RBAC
- **Validation:** ใช้ zod; ห้าม `any` / `@ts-ignore`
- **E2E:** ต้องรอ `waitForHydration` (networkidle) ก่อน interact — click ก่อน hydration เสร็จจะถูกกลืน
- **UI ทุกสถานะ:** ทุกหน้า dashboard ต้องมี Loading/Empty/Error/Permission state ตาม §5.3

## 4. หลักคิดก่อนเขียนโค้ด

1. **คิดก่อนทำ** — สมมติฐานไม่ชัดให้ถาม; มีทางง่ายกว่าให้เสนอ; ขัดกับ system-design ให้หยุดแล้วแจ้ง
2. **เรียบง่ายก่อน** — ไม่ทำเกิน requirement, ไม่สร้าง abstraction ล่วงหน้า, ถ้า 200 บรรทัดทำได้ใน 50 ให้เขียนใหม่
3. **แผลผ่านเล็กที่สุด** — แตะเฉพาะบรรทัดที่เกี่ยวกับงาน; ไม่ "ปรับปรุง" โค้ดข้างเคียงที่ไม่ได้ขอ; ตรง pattern เดิมของโปรเจกต์แม้จะไม่ใช่สไตล์ที่ชอบ
4. **Goal-driven** — เปลี่ยนงานเป็นเกณฑ์ตรวจที่วัดได้ (test ผ่าน, curl 200, ไม่ overflow ทุก breakpoint) แล้ววนแก้จนผ่านจริง ไม่ใช่แค่ "น่าจะได้"
