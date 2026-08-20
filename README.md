# ระบบตรวจสอบและรับรองแหล่งที่มาของผ้าไหมทอมือบุรีรัมย์

เว็บแอปพลิเคชัน Nuxt 4 แบบ Full-stack สำหรับลงทะเบียนผ้าไหม ออกใบรับรอง ส่งมอบ และตรวจสอบแหล่งที่มาผ่าน QR Code โดยใช้ **Local Blockchain Simulation** (SHA-256 Hash Chain + Proof of Authority + Ed25519 Signature)

> **หมายเหตุ:** Blockchain ในระบบนี้เป็น Local Simulation เพื่อการศึกษา ไม่ใช่ Distributed Network จริง

Source of truth ของการออกแบบ: [`docs/system-design.md`](docs/system-design.md) · การออกแบบฐานข้อมูล: [`docs/database-design.md`](docs/database-design.md)

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Nuxt 4 (Full-stack, TypeScript) |
| Package Manager | pnpm |
| Database | PostgreSQL 17 (Docker Compose) |
| ORM | Prisma 7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide (`@lucide/vue`) |
| Auth | `nuxt-auth-utils` (Sealed Cookie Session) |
| Test | Vitest (unit/integration) + Playwright (E2E) |

## เริ่มต้นใช้งาน (สำหรับสมาชิกทีม)

**Prerequisites:** Node.js 20.19+ · pnpm 11 (`corepack enable`) · Docker Desktop

```bash
# 1. ติดตั้ง dependencies
pnpm install

# 2. สร้างไฟล์ environment
cp .env.example .env
# แก้ NUXT_SESSION_PASSWORD เป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร
# (สร้างได้ด้วย: openssl rand -base64 32)

# 3. เริ่ม PostgreSQL (รอสถานะ healthy สักครู่)
docker compose up -d

# 4. รัน database migration
pnpm db:migrate

# 5. เริ่ม dev server → http://localhost:3007
pnpm dev
```

## Scripts

| คำสั่ง | คำอธิบาย |
|---|---|
| `pnpm dev` | เริ่ม Nuxt development server |
| `pnpm build` | Production build |
| `pnpm typecheck` | ตรวจ TypeScript ทั้งโปรเจกต์ |
| `pnpm lint` | รัน ESLint |
| `pnpm test` | Unit / Integration tests (Vitest) |
| `pnpm test:e2e` | Browser E2E tests (Playwright) |
| `pnpm db:migrate` | สร้าง/apply Prisma migration |

> `db:seed` และ `ledger:verify` จะเพิ่มเมื่อ implementation รองรับจริง

## โครงสร้างโปรเจกต์

```text
app/
  assets/css/main.css     # Tailwind entry
  components/
    ui/                   # AppSidebar, AppHeader, ... (shared components)
    domain/               # (จะเพิ่ม) SilkItemCard, CertificateTimeline
  composables/
    useDashboardNav.ts    # เมนู dashboard แยกตาม role
  layouts/
    default.vue           # Public: top navigation
    dashboard.vue         # Authenticated: sidebar + mobile drawer
  pages/
    index.vue verify.vue ledger.vue about.vue   # Public routes
    weaver/ review/ transfers/                  # Dashboard routes (โครงเบื้องต้น)
server/
  utils/db.ts             # Prisma client singleton
shared/
  types/ utils/           # (จะเพิ่ม) DTO + canonical serialization
prisma/
  schema.prisma           # Domain schema 14 ตาราง
  migrations/
test/
  unit/ integration/ e2e/
storage/
  uploads/ validator-keys/  # ไฟล์หลักฐาน + private key (server-only, ไม่ขึ้น Git)
```

## การแบ่งงานทีม (5 คน)

| ผู้รับผิดชอบ | Module | อ้างอิงหลัก | ส่งมอบหลัก |
|---|---|---|---|
| PM | Shared UI + Layout + ประสานงาน | system-design §5.1–5.3 | layouts, ui components, useToast/useConfirm |
| สมาชิก 1 | Auth + RBAC | §5.2, §14.4 | login/logout, session, middleware `auth.ts`/`role.ts`, seed บัญชี demo |
| สมาชิก 2 | Silk Item Workflow | §6.1–6.2, §11.1 | draft/revision/evidence upload/submit, review queue |
| สมาชิก 3 | Ledger Simulator | §8, §10.4–10.7 | SHA-256 chain, Ed25519, PoA round-robin, `/api/ledger/*` |
| สมาชิก 4 | Certification + Transfer | §6.3, §11.2–11.5 | approve แบบ atomic, QR, public cert page, custody transfer |

**ลำดับการทำงาน (Build Order):** ตาม `docs/system-design.md` §19 — Foundation → Shared UI → Auth/RBAC → Silk Item Workflow → Ledger Simulator → Certification → Certificate Status/Custody → Blockchain Explorer → Quality Gate → Demo

**จุดประสานงานสำคัญ:** สมาชิก 3 และ 4 ต้องใช้ transaction pattern เดียวกันตาม `docs/database-design.md` §7

## กติกาการทำงานร่วมกัน

- **Branch:** `feature/<module>-<รายละเอียด>` เช่น `feature/auth-login`, `fix/ledger-nonce`
- **PR:** อย่างน้อย 1 review (PM หรือเจ้าของ module ที่เกี่ยวข้อง) และต้องผ่าน `pnpm typecheck && pnpm lint && pnpm test` ก่อน merge
- **ก่อนเริ่มงาน:** อ่าน `docs/system-design.md` ส่วนที่เกี่ยวข้อง + ดูว่ามี component ใช้ร่วมได้ใน `app/components/ui/` ก่อนสร้างใหม่
- **ห้าม:** commit `.env`, private key, ไฟล์ใน `storage/` · ใช้ `any`/`@ts-ignore` · เปลี่ยน DB schema โดยไม่คุยกับทีมก่อน
- **Sync ทีม:** อย่างน้อยสัปดาห์ละ 1 ครั้ง

## ข้อตกลง UI ของทีม

- Vue Composition API + `<script setup lang="ts">`
- Tailwind CSS — สีทั้งระบบเป็น semantic token ที่นิยามใน `app/app.config.ts` เขียนเป็น `bg-primary` / `text-error-700` ห้าม hard-code ชื่อ palette (`amber-600`) โดยตรง
  - `primary` amber (ไหมทอง) — action หลักของแบรนด์ · `secondary` stone — action รอง
  - `success` emerald (อนุมัติ/ACTIVE/ACCEPTED) · `warning` orange (รอตรวจ/SUSPENDED) · `error` rose (ปฏิเสธ/REVOKED/ปุ่มทำลาย) · `info` cyan (Simulation/หมายเหตุ)
  - `neutral` slate — surface และข้อความ (override palette neutral ของ Tailwind ให้มาจาก config)
- Lucide icons เท่านั้น; icon-only button ต้องมี `aria-label`
- ใช้ `useToast()` สำหรับผล action, `useConfirm()` สำหรับ action ที่ย้อนกลับยาก (จะ implement ใน Phase 2)
- ห้ามใช้ browser `alert()`/`confirm()`
- ทุก status ต้องมีข้อความคู่กับ visual indicator ไม่ใช้สีอย่างเดียว
- หน้า dashboard ต้องมี Loading/Empty/Error/Permission states
