# 04 — บทบาท: Blockchain Engine + QA (แกนวิชา + คุณภาพระบบ)

> **ให้ AI agent อ่านก่อน:** `AGENTS.md` → skill `web-ui-coding-standards` → `docs/teamwork/00-shared-contract.md` (สัญญากลาง) → ไฟล์นี้
> อ้างอิงหลัก: `docs/system-design.md` §8 (Consortium + PoA), §10.4–10.7 (ledger data design), §16 (Nuxt implementation), §22 (Definition of Done)
> อ้างอิงฐานข้อมูล: `docs/database-design.md` §7 (transaction pattern), §8 (ledger design)

## ภาพรวมงานคุณ

คุณเขียน **หัวใจของวิชา blockchain** — Ledger Simulator (SHA-256 Hash Chain + Ed25519 + PoA round-robin) ที่พิสูจน์ความถูกต้องได้ — แล้วเปลี่ยนบทเป็น **QA ทั้งระบบ** ช่วงท้ายเพื่อการันตีว่ารวมงานแล้วรันได้จริง

**แตะได้:** `shared/utils/**`, `server/services/ledger*`, `server/api/ledger/**`, `prisma/seed-ledger.ts`, `test/unit/ledger*`, `test/integration/ledger*`, `test/e2e/**` (ชุด QA), `package.json` (เฉพาะ script `ledger:verify`)
**ห้ามแตะ:** `app/pages/**`, `app/components/**`, `server/api/**` (ยกเว้น ledger), `prisma/schema.prisma`, `prisma/seed.ts` (ของคน 3 — คุณสร้าง `seed-ledger.ts` ให้เขา import)

---

## Phase 1 — แกน crypto (เริ่มทันที · ไม่ต้องรอใคร · คน 3 รอคุณอยู่)

### 1.1 Canonical serialization — `shared/utils/canonical-serialize.ts`

ก่อน hash อะไรต้องแปลงเป็น string แบบที่ทั้งระบบนิ่ง:

- [ ] กฎ: object key เรียงตามตัวอักษร, ไม่มี whitespace, string ใส่ double quote, number ไม่มี leading zero, null/boolean ตาม JSON, array คงลำดับ
- [ ] Export `canonicalSerialize(value: unknown): string` + `sha256Hex(input: string): string` (ใช้ `node:crypto`)
- [ ] **Unit test ยืนยันความนิ่ง:** object เดียวกันสลับลำดับ key → string เดียวกัน; ตัวเลข format คงที่; hash `canonicalSerialize({a:1,b:2})` เทียบค่าคงที่ (hardcode ค่าที่คำนวณแล้วใน test)

### 1.2 `server/services/ledger.service.ts` — ตาม **Contract A** ใน `00-shared-contract.md` เป๊ะ

**สร้าง key pair ก่อน (สำหรับ seed):**

- [ ] `generateValidatorKeyPair()` — Ed25519 ผ่าน `node:crypto` (`generateKeyPairSync('ed25519')`); export เป็น PEM; เก็บ private ที่ `storage/validator-keys/<validatorId>.pem`, public ลง DB

**`seedLedger(tx)`:**

- [ ] สร้าง validator 3 ราย ตาม `ValidatorAuthorityRole`: `COOPERATIVE_AUTHORITY` (สหกรณ์), `LOCAL_CERTIFIER_AUTHORITY` (ผู้ตรวจรับท้องถิ่น), `RETAIL_NETWORK_AUTHORITY` (ตัวแทนร้านค้า) — ชื่อไทยกำกับ, `nonce = 0`, `isActive = true`
- [ ] สร้าง **Genesis Block** (index 0): event GENESIS เดียว, payload `{ note: 'Local Blockchain Simulation Genesis' }`, previousHash = 64 ตัว '0', validator รายแรก
- [ ] Idempotent: เรียกซ้ำเมื่อมีข้อมูลแล้ว → ข้าม (ไม่ throw) เพื่อให้ seed รันซ้ำได้

**`appendEvents(tx, events)`:**

- [ ] ดึง block สุดท้าย (`index` สูงสุด) → `previousHash`
- [ ] เลือก validator **round-robin**: เรียง validator ที่ active ตาม `createdAt` แล้วหมุนเวียนด้วย `blockCount % validatorCount`
- [ ] `nonce` = nonce ปัจจุบันของ validator รายนั้น + 1 (บันทึกกลับ DB ด้วย)
- [ ] คำนวณตามสูตรใน schema comment: `hash = SHA256(index + timestamp + canonicalData + nonce + previousHash + validatorId)` — นิยาม "canonicalData" ของคุณต้อง document ไว้ใน comment ของไฟล์ให้คน 1 เอาไปเขียนรายงาลได้
- [ ] `signature = Ed25519Sign(hash, privateKey)` (อ่าน private key จากไฟล์)
- [ ] บันทึก `ledger_blocks` + `ledger_events` **ทั้งหมดผ่าน `tx`** ที่รับมา — ห้ามสร้าง transaction ใหม่เอง
- [ ] Event หลายตัวในการเรียกครั้งเดียว → block เดียวบรรจุทุก event (dataHash ครอบทุก event)

**`verifyChain()`:**

- [ ] ดึง block ทุกลูกเรียงตาม index แล้วตรวจทีละ block:
  1. **hash ตรง** — คำนวณใหม่จากข้อมูลใน DB แล้วเทียบ
  2. **previousHash เชื่อมถูก** — เท่ากับ hash ของ block ก่อนหน้า (block 0 ต้องเป็น 64 ตัว '0')
  3. **nonce ต่อเนื่อง** — nonce ของ validator รายนั้นเพิ่มขึ้นทีละ 1 ตาม block ที่เขาลงนาม
  4. **rotation ถูก** — ลำดับ validator ตรงกับ round-robin จริง
  5. **signature ถูก** — verify ด้วย public key ใน DB
- [ ] คืน `VerifyResult` ตาม contract: valid, checkedBlocks, firstInvalidIndex, detail (อธิบายเป็นภาษาอังกฤษเชิงเทคนิค — ฝั่ง UI คน 2 จะแปลไทย)

### 1.3 Unit test — หัวใจคะแนน "ความเข้าใจเชิงเทคนิค" (test/unit/ledger/*.spec.ts)

ใช้ mock `tx` หรือ test double ได้ (ไม่ต้องต่อ DB จริงก็ได้ ถ้าออกแบบให้แยกส่วน query ได้ — แต่ integration test ต้องใช้ DB จริง):

- [ ] Chain ถูกต้อง → `verifyChain()` คืน valid
- [ ] **Tamper 3 แบบ ต้องจับได้ทุกแบบ:**
  1. แก้ `hash` ของ block กลาง → จับได้ (hash mismatch)
  2. แก้ `previousHash` ของ block ถัดไป → จับได้ (chain ขาด)
  3. แก้ `signature` → จับได้ (signature invalid)
- [ ] แก้ payload ของ event แล้วคำนวณ hash ใหม่ไม่ได้ (hash เดิมไม่ตรง) → จับได้
- [ ] สลับลำดับ block → จับได้ (previousHash ไม่เชื่อม)
- [ ] Validator rotation ผิด (สมมติ block ติดกันใช้ validator เดิมทั้งที่ควรหมุน) → จับได้
- [ ] Round-robin: สร้าง block 7 ลูกด้วย validator 3 ตัว → แต่ละตัวได้ 2-3 ตัว nonce เพิ่มตามจำนวน block ที่ลงนาม

### 1.4 `prisma/seed-ledger.ts` + script

- [ ] Export ฟังก์ชัน seedLedger ให้ `prisma/seed.ts` ของคน 3 เรียก (ไฟล์นี้เป็นของคุณ — คน 3 import พอ)
- [ ] Script `pnpm ledger:verify` ใน `package.json` — เชื่อม DB (ใช้ `server/utils/db.ts` pattern: PrismaPg adapter) เรียก `verifyChain()` แล้ว print ผลอ่านง่าย: จำนวน block ตรวจแล้ว / VALID เขียวหรือ INVALID แดงพร้อม block ที่พัง + เหตุผล · exit code 0/1

### 1.5 Integration test (test/integration/ledger/)

- [ ] ต่อ DB จริง: `seedLedger` → `appendEvents` หลายรอบ → `verifyChain()` valid
- [ ] **Append-only trigger ทำงานจริง:** `UPDATE ledger_blocks SET hash=...` โดยตรง → ต้องโดน DB ปฏิเสธ (มี trigger อยู่แล้ว — เขียน test ยืนยัน)
- [ ] Transaction กลับด้วยกัน: สั่ง append แล้วบังคับ throw หลัง appendEvents ใน transaction เดียวกัน → ต้องไม่เหลือ block กำพร้า

**→ ส่ง Phase 1 PR ทันทีที่ผ่าน · คน 3 รอ `appendEvents` + `seedLedger` อยู่**

---

## Phase 2 — Ledger API (หลัง Phase 1 · อิสระจากคนอื่น)

- [ ] `GET /api/ledger/blocks` — Public; คืน `LedgerBlockSummary[]` เรียง index ล่าสุดก่อน; รองรับ pagination ง่าย ๆ (`?limit=50&before=<index>`); **ตัด PII ทุกอย่าง** — ไม่คืน actorId/payload ดิบ ใน list
- [ ] `GET /api/ledger/blocks/:index` — คืน `LedgerBlockDetail` (events + payload + `signatureValid` คำนวณสด) · block ไม่มี → 404
- [ ] `GET /api/ledger/verify` — คืน `VerifyResult` (เพิ่ม timestamp ที่ตรวจ)
- [ ] Payload ใน detail: แสดงได้เพราะ design บังคับแล้วว่า payload ไม่มี PII — แต่เขียน test ยืนยันว่า event ที่ seed/append ไม่มี field ชื่อ/email/เบอร์

---

## Phase 3 — QA ทั้งระบบ (หลังคน 2 + 3 ต่อกันเสร็จ · ประมาณสัปดาห์ 15)

> หน้าที่ QA: **ค้นหา bug และเปิด issue — ไม่แก้โค้ดคนอื่นเอง** (แจ้งเจ้าของ module ผ่าน PM) ยกเว้น test file ที่คุณเป็นเจ้าของ

### 3.1 Permission matrix e2e (`test/e2e/qa-permissions.spec.ts`)

- [ ] ตาราง role × route/API ครบทุกช่อง — ตัวอย่างเคสที่ต้องครบ:
  - WEAVER เข้า `/review` → redirect/403
  - OFFICER เรียก `POST /api/silk-items` → 403
  - STORE_USER เรียก approve → 403
  - ไม่ login เรียก mutation ไหนก็ได้ → 401
  - WEAVER A แก้ draft ของ WEAVER B → 403
- [ ] เขียนเป็น loop จากตาราง config เพื่อให้ครบโดยไม่พลาด

### 3.2 Tamper e2e (`test/e2e/qa-tamper.spec.ts`)

- [ ] ออกแบบ flow เต็มจนมี block ≥3 → แก้ `ledger_blocks.hash` ตรง ๆ ใน DB (ผ่าน prisma ใน test) → `/ledger` ต้องแสดง INVALID ชัด + `/api/ledger/verify` คืน valid=false + firstInvalidIndex ถูก
- [ ] แก้ `previousHash`, `signature` — ทำซ้ำให้จับได้ทุกแบบ

### 3.3 Demo flow e2e ครบชุด (`test/e2e/qa-demo-flow.spec.ts`) — ตาม §21

- [ ] ช่างทอ login → สร้าง → แนบไฟล์ → ส่ง
- [ ] สหกรณ์ login → ดูคิว → อนุมัติ
- [ ] เปิด Explorer เห็น block ใหม่ + signature valid
- [ ] เปิด `/certificate/<code>` เห็น VALID
- [ ] ส่งมอบ → ร้านค้ายืนยัน → timeline เพิ่ม
- [ ] เพิกถอน (ผ่าน confirm dialog) → public cert เปลี่ยนเป็น REVOKED + integrity ยัง valid (เพราะเพิกถอนก็เป็น event ถูกต้อง)

### 3.4 Robustness sweep

- [ ] Duplicate submit ทุกปุ่ม (กดรัว 2 ครั้งเร็ว ๆ) — ไม่เกิดข้อมูลซ้ำ
- [ ] Concurrent approve คำขอเดียวกัน 2 request → ได้ certificate เดียว
- [ ] Concurrent accept transfer 2 ครั้ง → custodian เปลี่ยนครั้งเดียว
- [ ] ทุก public API response ไล่ check ไม่มี PII หลุด (ชื่อจริง/อีเมล/internal uuid ของ user)
- [ ] ไฟล์ evidence เข้าถึงตรง URL ไม่ได้ (ต้องผ่านสิทธิ์)

### 3.5 รายงานผล QA

- [ ] สรุปผลเป็น `docs/report/qa-report.md`: อะไรผ่าน/อะไรพัง + ขั้นตอน reproduce — ให้ PM ใช้ตัดสินว่าพร้อมส่งมอบไหม (อ้าง Definition of Done §22 ทีละข้อ)

---

## เกณฑ์เสร็จ (Definition of Done)

- [ ] Unit + integration test ผ่านครบ รวม tamper ทุกแบบ
- [ ] `pnpm ledger:verify` ใช้งานได้จริง (ออกแบบ exit code ให้ CI เรียกได้)
- [ ] ให้ข้อมูลจริงแก่คน 1 (Block structure ทุก field, สูตร hash, วิธี rotation) ตอนสัปดาห์ 14
- [ ] QA ทั้งหมดรันผ่าน หรือ รายงานข้อพังพร้อมแนวทางแก้ก่อนสัปดาห์ 16
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` ผ่านทั้งชุด

## ถ้าติดขัด

- สูตร hash ต้องนิยามเพิ่ม (เช่น timestamp format ใช้ ISO หรือ epoch) → นิยามเองได้ **แต่ต้อง document ใน comment + แจ้งคน 1** ให้เอาไปเขียนรายงาลตรงกัน
- ระบบยังต่อกันไม่ครบ → ทำ Phase 2 ให้จบก่อน แล้วเตรียมชุด QA รอ
- เจอ bug ของคนอื่น → เปิด issue + แจ้ง PM อย่าแก้เอง (นอกจาก PM สั่ง)
