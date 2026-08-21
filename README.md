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

**Prerequisites:** Docker Desktop · (วิธีที่ 2 เพิ่ม: Node.js 20.19+ · pnpm 11 ผ่าน `corepack enable`)

เตรียมไฟล์ environment ก่อนเสมอ:

```bash
cp .env.example .env
# แก้ NUXT_SESSION_PASSWORD เป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร
# (สร้างด้วย: openssl rand -base64 32)
```

### วิธีที่ 1 — รันทั้งระบบด้วย Docker (คำสั่งเดียว)

```bash
docker compose up -d --build
```

ระบบจะเริ่ม 3 services ตามลำดับอัตโนมัติ: **postgres** (รอ healthy) → **migrate** (apply Prisma migrations แล้วจบ) → **app** (production build)

- เข้าใช้งานที่ **http://localhost:3007**
- คำสั่งเสริม: `docker compose logs -f app` (ดู log) · `docker compose up -d postgres` (เฉพาะ DB สำหรับ dev) · `docker compose down` (ปิดทั้งหมด — ข้อมูลใน volume ไม่หาย)

### วิธีที่ 2 — พัฒนาด้วย pnpm dev (แนะนำตอนเขียนโค้ด)

```bash
# 1. เริ่มเฉพาะ PostgreSQL (รอสถานะ healthy สักครู่)
docker compose up -d postgres

# 2. ติดตั้ง dependencies + รัน database migration
pnpm install
pnpm db:migrate

# 3. เริ่ม dev server → http://localhost:3007
pnpm dev
```

> **ข้อควรระวัง:** service `app` ของ Docker กับ `pnpm dev` ใช้ port 3007 ทั้งคู่ — ก่อนเริ่ม dev ให้ `docker compose stop app` ก่อน

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
docker-compose.yml        # postgres + migrate (one-shot) + app
Dockerfile                # Multi-stage build (builder → runner)
test/
  unit/ integration/ e2e/
storage/
  uploads/ validator-keys/  # ไฟล์หลักฐาน + private key (server-only, ไม่ขึ้น Git)
```

## การแบ่งงานทีม (5 คน)

> **แผนงานฉบับเต็ม:** โฟลเดอร์ [`docs/teamwork/`](docs/teamwork/) — แยกเป็น brief รายคน ใช้ต่อกับ AI agent ได้เลยจนจบ
> **วิธีใช้:** แจกไฟล์ของแต่ละคน (01–04) ให้เพื่อนบอก AI agent ว่า "อ่าน `AGENTS.md` → skill `web-ui-coding-standards` → `docs/teamwork/00-shared-contract.md` → ไฟล์ brief ของตัวเอง แล้วทำตาม checklist" — ทุกคนทำงานบน branch ตัวเอง แล้ว PM รวมตามคู่มือ `05-pm-integration.md`

| ไฟล์ brief | ตำแหน่ง | หน้าที่ (1 ประโยค) |
|---|---|---|
| `00-shared-contract.md` | ทุกคน | สัญญากลาง: contract A/B/C, แผนที่ความเป็นเจ้าของไฟล์, กติกา |
| `01-docs.md` | นักวิเคราะห์ธุรกิจ และ ผู้รับผิดชอบเอกสาร | วิเคราะห์ปัญหาธุรกิจ ผู้เกี่ยวข้อง และกระบวนการทำงาน แล้วสื่อสารเป็นรายงาน สไลด์ และหน้าเว็บเนื้อหาให้ครบตามเกณฑ์ของอาจารย์ |
| `02-frontend.md` | นักพัฒนา Frontend | สร้างหน้าเว็บทุกหน้าให้ใช้งานได้จริงครบทุกสถานะ พร้อม shared UI ที่ทั้งทีมใช้ โดยต่อกับ API ของ Backend |
| `03-backend.md` | นักพัฒนา Backend | สร้าง API ทุก endpoint พร้อมระบบยืนยันตัวตนและสิทธิ์การใช้งาน ให้ปลอดภัยทุกชั้น และเตรียมข้อมูลตัวอย่างให้พร้อมสาธิต |
| `04-blockchain-qa.md` | วิศวกรบล็อกเชน และ ผู้ทดสอบระบบ | สร้าง Ledger Simulator ที่พิสูจน์ความถูกต้องได้ และทดสอบระบบทั้งหมดก่อนส่งมอบเพื่อการันตีคุณภาพ |
| `05-pm-integration.md` | หัวหน้าโครงการ | วางแผนและประสานงานทั้งทีม ตรวจรับและรวมงานทุกส่วนให้ระบบรันได้จริงในคำสั่งเดียว ควบคุมคุณภาพถึงวันนำเสนอ |
| `06-next-steps.md` | ทุกคน | คิวงานถัดไปหลัง backend เสร็จ: ตรวจรับ PR คน 4, งานต่อรายคน, ประเด็น Docker validator keys |

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
