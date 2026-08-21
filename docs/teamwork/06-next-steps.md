# 06 — สิ่งที่ต้องทำต่อหลังสมาชิก 4 (Blockchain) ส่งงาน

> ไฟล์นี้บันทึก "คิวงานถัดไป" ของทั้งทีม ณ ตอนที่ backend (สมาชิก 3) เสร็จแล้ว
> สถานะปัจจุบัน: backend merge พร้อม (branch `ิbackend`) · `ledger.service` ยังเป็น **mock** รอคน 4 เขียนทับ · frontend (คน 2) เริ่ม wire API ได้แล้ว

## 1. ทันทีที่ PR ของสมาชิก 4 มาถึง (PM ตรวจก่อน merge)

- [ ] Interface ตรง **Contract A** เป๊ะ (`appendEvents(tx, events)`, `verifyChain()`, `seedLedger(tx)` — ชนิด/ชื่อเหมือน mock ปัจจุบัน) → ถ้าตรง endpoint ของคน 3 **ไม่ต้องแก้อะไรเลย**
- [ ] Mock ถูกแทนที่จริง: hash เป็น SHA-256 จริง, signature เป็น Ed25519 จริง, validator 3 ราย round-robin (ไม่ใช่ MOCK_VAL_1 ตัวเดียว)
- [ ] ตรวจ unit test tamper ครบ: แก้ hash / previousHash / signature / สลับลำดับ block → `verifyChain()` ต้องจับได้ทุกแบบ
- [ ] `pnpm ledger:verify` มี script จริงใน package.json และ exit code ถูก (0=VALID, 1=INVALID)

## 2. หลัง merge — PM รัน integration checklist นี้เอง

```bash
git pull origin main && pnpm install
pnpm db:reset                 # seed ใหม่ + genesis block จริง
pnpm ledger:verify            # ต้อง VALID (ไม่ใช่ mock อีกต่อไป)
pnpm dev                      # เดิน flow มือ: login → สร้าง → ส่ง → อนุมัติ → ดู block ใหม่มี hash/signature จริง
pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e
docker compose down && docker compose up -d --build   # ทดสอบใน container ด้วย (ดูข้อ 4.1)
```

- [ ] อนุมัติคำขอแล้ว block ใหม่ต้องมี hash 64 ตัว (hex) ไม่ใช่ `mock_hash_...`
- [ ] เรียก `GET /api/ledger/verify` ได้ valid=true จากของจริง

## 3. งานต่อของแต่ละคนหลัง blockchain พร้อม

| ใคร | ทำอะไรต่อ | อ้างอิง |
|---|---|---|
| **คน 2 (Frontend)** — *critical path ใหญ่สุด* | wire หน้าที่เหลือทั้งหมด: login ฟอร์มจริง → silk items (รายการ/สร้าง/แนบ/ส่ง) → review → public cert + verify → transfers → certificate manage → **Explorer (`/ledger`, `/ledger/[height]`) ต่อ `/api/ledger/*` ที่คน 4 ส่งมา** | `docs/teamwork/02-frontend.md` Phase 2 |
| **คน 3 (Backend)** | เช็ค `hashSummary` ใน public cert ว่าอ่านผล signature จริงจาก ledger.service ใหม่ (ไม่ใช่ค่า hard-code) · ปรับ seed ให้เรียก `seedLedger` จริง (ตอนนี้ try/catch ไว้) | `docs/teamwork/03-backend.md` §3.4 |
| **คน 1 (Docs)** | **ดึงข้อมูลจริงจากคน 4 ทันที**: โครง block ทุก field, สูตร hash, วิธี round-robin, ตัวอย่าง hash/signature จริง → เขียน `02-solution-architecture.md` (W14 ต้องเสร็จ) | `docs/teamwork/01-docs.md` A3 |
| **คน 4** | ต่อ Phase 3 ของตัวเอง: QA ทั้งระบบ (permission matrix e2e, tamper e2e, demo flow e2e, robustness) | `docs/teamwork/04-blockchain-qa.md` Phase 3 |
| **PM** | merge ตามลำดับที่เหลือ + ตาม timeline รายงาน (W14 consultation → W15 draft → W16 ส่ง) | `docs/teamwork/05-pm-integration.md` |

## 4. ประเด็นเทคนิคที่ต้องจัดการ (PM ต้องตัดสิน/มอบหมาย)

### 4.1 ⚠️ Private key ของ validator จะหายใน Docker (สำคัญ — จะพังตอน Demo)

- **ปัญหา:** ตอนนี้ seed รันใน container `migrate` (one-shot แล้วตาย) → Ed25519 private key ที่สร้างตอน seed อยู่ในไฟล์ `storage/validator-keys/` **ภายใน container นั้น** → พอ container ตาย key หาย → container `app` ไม่มี key ไป sign block ต่อ → approve/transfer พังใน Docker (แม้บนเครื่อง dev จะปกติ)
- **วิธีแก้ (แนะนำ):** เพิ่ม named volume (เช่น `validator_keys`) mount ที่ `/app/storage/validator-keys` **ทั้ง service `migrate` และ `app`** + ตั้ง `VALIDATOR_KEY_DIR=/app/storage/validator-keys` ให้ทั้งคู่ — มอบหมายให้คน 4 ทำใน PR ของเขา (เจ้าของระบบ key)
- **ต้องทดสอบ:** `docker compose down -v && docker compose up -d --build` → login → อนุมัติคำขอใน container → ต้องสร้าง block สำเร็จ

### 4.2 `ledger:verify` รันไม่ได้ใน production image

- Runner stage คัดลอกแค่ `.output` (ไม่มี source/script) → ใช้ `pnpm ledger:verify` ใน container ไม่ได้
- **ทางเลือก:** ใช้ `GET /api/ledger/verify` แทนตอนตรวจใน Docker (มีอยู่แล้ว) — เพียงพอสำหรับ Demo; หรือถ้าอยากได้ command จริงให้คน 4 ทำเป็น Nitro task/endpoint เพิ่ม

### 4.3 เตือนคน 2 เรื่อง toast stub

- `app/composables/useToast.ts` เป็น stub 19 บรรทัดที่คน 3 สร้างไว้ — **ทำต่อ อย่าเขียนทับ** และระวัง conflict กับ `AppHeader.vue` / `layouts/default.vue` ที่คน 3 แตะไว้

## 5. คิวสุดท้ายถึงวันส่ง (W15–16)

1. [ ] Frontend wire ครบทุกหน้า + ทุกสถานะ (คน 2)
2. [ ] QA ทั้งระบบผ่าน + `docs/report/qa-report.md` (คน 4)
3. [ ] รายงาน v1 → feedback → ฉบับสมบูรณ์ + สไลด์ (คน 1 + PM)
4. [ ] Quality Gate: gates 4 ชั้น + `docker compose up -d --build` + `db:reset` + เดิน demo §21 ครบ 7 ขั้น (PM)
5. [ ] ซ้อมนำเสนอ 15–20 นาที + อัดวิดีโอ demo สำรอง (PM)

## หมายเหตุ: ของที่ค้างอยู่ตอนนี้ (บน branch `ิbackend`)

```text
M playwright.config.ts              # แก้ pnpm.cmd → cross-platform
M docker-compose.yml                # migrate service + auto-seed
M test/integration/api.spec.ts      # ensureTestOrg() — test ผ่านแม้ DB ว่าง
```

ยังไม่ได้ commit — ให้ PM commit พร้อม message แนะนำ:
`fix(review): cross-platform playwright, docker auto-seed, self-sufficient integration tests`
