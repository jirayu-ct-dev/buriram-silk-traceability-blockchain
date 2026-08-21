# 02 — นักพัฒนา Frontend (Frontend Developer)

> **หน้าที่ใน 1 ประโยค:** สร้างหน้าเว็บทุกหน้าให้ใช้งานได้จริงครบทุกสถานะ พร้อม shared UI (toast/confirm/badge) ที่ทั้งทีมใช้ โดยต่อกับ API ของ Backend

> **ให้ AI agent อ่านก่อน:** `AGENTS.md` → skill `web-ui-coding-standards` → `docs/teamwork/00-shared-contract.md` (สัญญากลาง) → ไฟล์นี้
> อ้างอิงหลัก: `docs/system-design.md` §5.1–5.3 (routes/UI standards), §6 (flows), §12 (public verification result), §13 (QR design)

## ภาพรวมงานคุณ

เปลี่ยน skeleton 17 หน้าให้เป็นหน้าจริงที่ใช้งานได้ครบทุกสถานะ (Loading/Empty/Error/Permission) ต่อ API ของคน 3 — พร้อมสร้าง shared UI (toast/confirm/badge) ที่ทั้งทีมใช้

**แตะได้:** `app/pages/**` (ยกเว้น `about.vue`, `privacy.vue`), `app/components/**`, `app/composables/**` (ยกเว้น `useAuthSession.ts`), unit test ของ component, e2e ที่ไม่ใช่ชุด QA ของคน 4
**ห้ามแตะ:** `server/**`, `prisma/**`, `shared/**`, `app/middleware/**`

---

## Phase 1 — Shared UI (เริ่มทันที ไม่ต้องรอใคร · คนอื่นรอคุณตรงนี้)

### 1.1 `useToast()` + `app/components/ui/AppToast.vue`

- [ ] Composable `app/composables/useToast.ts` — API: `toast.success(message)`, `toast.error(message)`, `toast.warning(message)`, `toast.info(message)`; หลาย toast พร้อมกันได้; auto-dismiss ~5 วินาที; มีปุ่มปิด (`aria-label="ปิดการแจ้งเตือน"`)
- [ ] Component แสดงมุมขวาบน (fixed, z-index สูงกว่า header), เข้า/ออกด้วย transition เบา ๆ
- [ ] สีตาม semantic token: success → `bg-success-600 text-white`, error → `bg-error-600`, warning → `bg-warning-600`, info → `bg-info-600`
- [ ] ให้ screen reader รับรู้: container `aria-live="polite"`
- [ ] Mount ครั้งเดียวที่ `app/app.vue` (ไฟล์นี้แตะได้เฉพาะเพิ่ม `<UiAppToast />` บรรทัดเดียว)
- [ ] Unit test: เรียกแต่ละ type แล้วข้อความ/สีถูก, ปิดได้

### 1.2 `useConfirm()` + `app/components/ui/AppConfirmDialog.vue`

ใช้ก่อน action ที่ย้อนกลับยาก (Suspend/Revoke/Cancel Transfer — ข้อบังคับ §5.3):

- [ ] API: `const confirmed = await confirmDialog({ title, message, confirmLabel?, cancelLabel?, danger?: boolean })` คืน `Promise<boolean>`
- [ ] โมดัลกลางจอ + overlay, `danger` ทำให้ปุ่มยืนยันเป็น `bg-error-600`
- [ ] Keyboard ครบ: Enter ยืนยัน, **Escape ยกเลิก**, focus trap ใน dialog, ปิดแล้วคืน focus ให้ trigger
- [ ] ปิดการ scroll ตอนเปิด (เหมือน pattern drawer ใน `layouts/dashboard.vue`)
- [ ] Unit test: ยืนยัน/ยกเลิก/Escape คืนค่าถูก

### 1.3 Domain components ที่ทุกหน้าใช้

- [ ] `UiStatusBadge.vue` — prop รับสถานะ (ทั้ง Revision/Certificate/Transfer ตาม Contract C) → แสดงสีตามความหมาย + **ข้อความไทยกำกับเสมอ** (เช่น `SUBMITTED` → สี warning + "รอตรวจ") — ใช้ `success/warning/error/neutral/info` token; ห้ามใช้สีล้ำ (ไม่มีใน config)
- [ ] `UiEmptyState.vue` — icon + หัวข้อ + คำอธิบาย + optional action (เช่นปุ่ม "ลงทะเบียนผ้าไหมผืนแรก")
- [ ] `UiErrorState.vue` — ข้อความภาษาไทยที่บอกวิธีแก้ (ไม่เปิดเผยรายละเอียดระบบ) + ปุ่ม "ลองใหม่"
- [ ] `UiSkeletonList.vue` — skeleton สำหรับ list/table ตอนโหลด

### 1.4 ฟอร์มลงทะเบียนผ้าไหม (`/weaver/items/new`) แบบ mock ก่อน

สร้างฟอร์มจริงตาม field ของ `SilkItemRevision` (ดู Contract B `revision`): title* (จำเป็น), pattern, material, technique, widthCm, lengthCm, productionDate, notes

- [ ] zod schema ใน `shared` ไม่ได้ (เขตคน 3) → สร้าง local schema ในหน้าไปก่อน; ตอน wire API จริงค่อยขอให้คน 3 เพิ่มใน server แล้วคุณ import จาก `shared/types/api.ts` ได้
- [ ] **ทุก field มี label มองเห็นได้** (ไม่ใช้ placeholder แทน label) + mark * สำหรับ required
- [ ] Inline error ใต้ field บอกวิธีแก้ ("กรุณากรอกชื่อผืนผ้า" ไม่ใช่ "invalid")
- [ ] กัน submit ซ้ำ (disable ปุ่มตอน pending + `pending` state)
- [ ] Mock submit แล้วโชว์ `useToast()` success ไปก่อน — เตรียมโครงไว้ให้ wire ทีหลังเร็ว
- [ ] แนบหลักฐาน: input file + รายการไฟล์ที่แนบ + แสดงชื่อไฟล์ (hash ให้คน 3 คิด — ฝั่งคุณแสดงชื่อกับขนาดพอ)

**ส่ง Phase 1 เป็น PR แรกทันที** — คน 3 (และทุกคนที่เขียนหน้าจริง) รอ toast/confirm อยู่

---

## Phase 2 — Wire API จริง (ทีละ module ตามคน 3 ส่ง)

> ใช้ `useFetch`/`$fetch` + type จาก `shared/types/api.ts` (Contract B) · ทุกหน้าต้องมี 4 สถานะครบ · action สำเร็จ/พังใช้ `useToast()` · ทำลายล้างใช้ `useConfirm()`
> ระหว่างรอ API จริง: สร้างหน้าครบด้วย mock data ก่อนได้ **แต่ห้าม mock ตอนส่งมอบสุดท้าย**

### 2.1 Auth (`/login`)

- [ ] เปลี่ยนจากปุ่มเลือกบทบาท → ฟอร์ม username/password เรียก `POST /api/auth/login`
- [ ] Error แสดง inline ใต้ฟอร์ม ("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง") — รักษาค่าที่กรอกไว้
- [ ] สำเร็จ → `navigateTo` หน้าหลักของ role (ใช้ `homeFor` จาก `useDashboardNav` เดิม)
- [ ] แสดงบัญชี demo ที่ seed ไว้เป็น hint เล็ก ๆ (username ของแต่ละ role)

### 2.2 Silk Items (ช่างทอ)

- [ ] `/weaver` — สรุปตามสถานะ (DRAFT/SUBMITTED/CERTIFIED/REJECTED เป็นการ์ดตัวเลข + ลิงก์เข้า list) + รายการล่าสุด เรียก `GET /api/silk-items`
- [ ] `/weaver/items/new` — wire กับ `POST /api/silk-items` + `POST /api/silk-items/:id/evidence` + `POST /api/silk-items/:id/submit` (ปุ่ม "ส่งขอรับรอง" มี confirm ก่อน เพราะล็อก revision)
- [ ] `/weaver/items/[id]` — รายละเอียด revision + evidence + ผลตรวจ (`latestReview`); ถ้า REJECTED แสดงเหตุผล + ปุ่ม "แก้ไขและส่งใหม่" (สร้าง revision ใหม่)
- [ ] แก้ได้เฉพาะ DRAFT — ถ้าสถานะอื่นซ่อนฟอร์มแก้ไข แสดงข้อมูลอย่างเดียว

### 2.3 Review (สหกรณ์)

- [ ] `/review` — คิวคำขอ (`GET /api/reviews`) เป็นตาราง: รหัสผ้า/ชื่อผืน/ผู้ส่ง/วันที่/ปุ่มตรวจ — ตามมาตรฐาน table ใน skill (text ชิดซ้าย, header เด่นพอประมาณ)
- [ ] `/review/[id]` — ข้อมูลครบทุก field + รายการ evidence + ฟอร์มตัดสิน: **อนุมัติ** (ปุ่ม primary) / **ปฏิเสธ** (ต้องเลือก reason code + กรอก note — required) เรียก approve/reject
- [ ] ผลลัพธ์ใช้ toast + กลับคิว

### 2.4 Public Certificate + Verify (ผู้บริโภค)

- [ ] `/verify` — ฟอร์มกรอก certificate code เดียว + รับ query param จาก QR (`/verify?code=...` หรือตรงเข้า `/certificate/<code>`) แล้ว redirect
- [ ] `/certificate/[id]` — แสดงตาม `PublicCertificate` (Contract B): ผล **VALID/SUSPENDED/REVOKED/NOT_FOUND** เป็น hero badge ใหญ่ (success/warning/error/neutral), ข้อมูลผ้า, ผู้ทอ, ผู้ออก, **Custody Timeline** (แนวตั้ง timeline แบบ ledger), **Hash Summary** (block index, hash ย่อ, ผล signature)
- [ ] ทุก hash แสดงแบบ truncate กลาง + ปุ่ม copy (`aria-label="คัดลอก hash"`) — ห้ามให้ยาวๆ พัง layout
- [ ] NOT_FOUND → ไม่ใช่ error page — แสดงการ์ด "ไม่พบใบรับรองนี้" + คำแนะนำตรวจสอบ code

### 2.5 Transfers (ทุก role)

- [ ] `/transfers` — รายการที่เกี่ยวข้องกับตน (`GET /api/transfers` ผ่าน list endpoint ของคน 3): ตาราง + `UiStatusBadge` + ปุ่มตามสิทธิ์ (`canResolve`)
- [ ] `/transfers/[id]` — รายละเอียด + ปุ่ม **ยืนยันรับ** (confirm ก่อน) / **ปฏิเสธ** (confirm ก่อน)
- [ ] ปุ่ม "สร้างการส่งมอบ" สำหรับ custodian ปัจจุบัน (เลือกผ้าที่มีใบรับรอง ACTIVE + เลือกร้านปลายทาง)

### 2.6 Certificate Manage (สหกรณ์)

- [ ] `/certificates/[id]/manage` — สถานะปัจจุบัน + ปุ่ม ระงับ/คืนสถานะ/เพิกถอน — **ทุกปุ่มต้องผ่าน `useConfirm()` พร้อมช่องกรอกเหตุผล** (required)
- [ ] เพิกถอน (REVOKED) ใช้ปุ่ม `bg-error-600` + ข้อความย้ำว่าย้อนกลับไม่ได้

### 2.7 Ledger Explorer (หน้าติดต่อกับ API ของคน 4)

- [ ] `/ledger` — รายการ block ล่าสุดก่อน (`GET /api/ledger/blocks`): index, เวลา, hash ย่อ, validator, จำนวน event + ป้าย "Local Blockchain Simulation" (มีอยู่แล้ว) + ผล integrity จาก `GET /api/ledger/verify` (ป้าย success/error)
- [ ] `/ledger/[height]` — Block detail: header ทุก field, รายการ event (`eventType` + payload), previousHash, **ผลตรวจ signature** เป็น badge

---

## เกณฑ์เสร็จ (Definition of Done)

- [ ] เดิน flow ได้ครบด้วย UI จริง: login 3 role → ช่างทอสร้าง+แนบ+ส่ง → สหกรณ์อนุมัติ/ปฏิเสธ → เห็น cert public → ส่งมอบ → ร้านค้ายืนยัน → เพิกถอนผ่าน confirm
- [ ] ทุกหน้า: 4 สถานะครบ + ไม่มี horizontal overflow ที่ 375/768/1440 + ใช้ keyboard ได้ครบ
- [ ] ไม่มี `alert()`/`confirm()` ของ browser · ไม่มี hard-code palette
- [ ] e2e ของตัวเองเพิ่มอย่างน้อย: สร้าง→ส่ง→เห็นในคิว · confirm ก่อน revoke · public cert NOT_FOUND
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` ผ่านทั้งชุด

## ถ้าติดขัด

- API คน 3 ยังไม่พร้อม → ทำหน้านั้นด้วย mock + ข้ามไปหน้าถัดไป อย่ารอเฉย ๆ
- DTO จริงต่างจาก Contract B → ห้ามแก้ type เองให้ตรง ให้แจ้ง PM ให้คน 3 แก้ต้นทาง
- ต้องแตะไฟล์นอกเขต (เช่นต้องแก้ middleware) → เปิด issue ให้คน 3 ทำ ห้ามแตะเอง
