# 05 — บทบาท: PM (รวมงาน + ให้ระบบรันได้จริงในคำสั่งเดียว)

> ไฟล์นี้คือคู่มือของคุณ (PM) — วิธีรวมงาน 4 คนให้เป็น main ที่รันได้ทันที + Quality Gate + Demo

## 1. ลำดับการ merge (สำคัญ — ทำตามลำดับนี้)

| ลำดับ | PR | เหตุผล / สิ่งที่ต้องระวัง |
|---|---|---|
| 1 | `shared/types/api.ts` (คน 3) | ไม่มี dependency — merge ให้เร็วเพื่อให้ทุกคน import จาก main ได้ |
| 2 | Phase 1 ของคน 4 (`ledger.service` + seed-ledger + `ledger:verify`) | คน 3 รอ `appendEvents` — เช็คว่า unit test tamper ครบทุกแบบก่อน merge |
| 3 | Shared UI ของคน 2 (toast/confirm/badge/skeleton + ฟอร์ม mock) | อิสระจาก backend — merge ได้ทันทีหลังผ่าน gates |
| 4 | Auth จริงของคน 3 | **ต้องระวัง conflict:** แตะ `AppUserMenu.vue`, `login.vue`, `dashboard.vue` — ถ้า branch คน 2 กำลังแก้ไฟล์เดียวกัน ให้ merge ฝั่งหนึ่งก่อนแล้ว rebase อีกฝั่ง |
| 5 | Module 2 (silk items) ของคน 3 + หน้าที่ wire แล้วของคน 2 | merge คู่กันเพื่อทดสอบ flow แรกจริง |
| 6 | Module 3 (cert/transfer) + Module 4 (seed) + หน้าที่เหลือ | ตามที่แต่ละคนส่ง |
| 7 | Ledger API ของคน 4 + หน้า Explorer ของคน 2 | หลังมี block จริงจาก flow |
| 8 | ชุด QA ของคน 4 | ท้ายสุด — ครอบระบบเต็ม |

**กฎการ merge:** ทุก PR ต้อง `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` ผ่านบน branch นั้นก่อน — คุณรันเองซ้ำบนเครื่องคุณก่อนกด merge (อย่าเชื่อ "ผ่านแล้ว" จากปากเปล่า)

## 2. ตรวจ conflict ที่คาดไว้ล่วงหน้า

1. **`app/components/ui/AppUserMenu.vue`** — คน 3 (ถอด demo role) vs คน 2 (อาจปรับ UI) → ให้คน 3 merge ก่อน แล้วคน 2 rebase
2. **`prisma/seed.ts`** — คน 3 เป็นเจ้าของ แต่เรียก `seed-ledger.ts` ของคน 4 → ต้อง merge PR คน 4 (ลำดับ 2) ก่อน PR seed (ลำดับ 6)
3. **`package.json` scripts** — คน 3 (`db:seed`, `db:reset`) กับคน 4 (`ledger:verify`) แตะคนละบรรทัด → conflict ง่าย ๆ รวมสองบรรทัดได้เลย
4. **`test/e2e/home.spec.ts`** — หลายคนเพิ่ม test → ถ้า conflict ให้เก็บทั้งสองฝั่ง (test ไม่ควรลบกัน)

## 3. Integration checklist — หลัง merge ทุกรอบ

```bash
git pull origin main
pnpm install                      # dependency อาจเปลี่ยน
pnpm db:reset                     # seed ใหม่ทั้งหมด
pnpm ledger:verify                # ต้อง VALID
pnpm dev                          # เดิน flow ด้วยมือ 10 นาที
```

เดิน flow ด้วยมือตาม §21: login ช่างทอ → สร้าง+แนบ+ส่ง → login สหกรณ์ → อนุมัติ → เปิด `/ledger` เห็น block → เปิด `/certificate/<code>` → ส่งมอบ → ร้านค้ายืนยัน → เพิกถอน (confirm ต้องขึ้น)

## 4. Quality Gate สุดท้าย (สัปดาห์ 16 · อิง Definition of Done §22)

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` ผ่านบน main
- [ ] **Docker ทั้งระบบ:** `docker compose down && docker compose up -d --build` → `docker compose logs migrate` (ผ่าน) → เปิด http://localhost:3007 เดิน flow ได้ครบ (รวมข้อมูล seed ถูกสร้างใน container — เช็คว่า seed รันใน migrate service หรือต้องเพิ่ม ให้คุยกับคน 3)
- [ ] `pnpm ledger:verify` → VALID
- [ ] QA report ของคน 4 — ทุกข้อพังถูกแก้หรือยอมรับได้
- [ ] ตรวจไม่มี PII ใน public API (เปิด devtools network ดู response ของ `/api/public/*`, `/api/ledger/*`)
- [ ] Responsive spot check 375/768/1440 ทุกหน้าหลัก + keyboard ใช้ได้
- [ ] ทุกหน้า public มีป้าย Simulation

## 5. งานเอกสารของ PM เอง

- [ ] **ประกอบรายงาน v1** (W14) จาก `docs/report/*.md` ของคน 1: ไล่เช็คว่าชื่อ actor/สถานะ/ศัพท์เทคนิคตรงกันทั้งเล่ม **และตรงกับหน้าเว็บจริง** (เปิดเว็บเทียบไปด้วย)
- [ ] นับหน้า 10–15 + ตรวจ APA 7 (in-text ตรงกับ reference list) + นับ references ≥8 / Primary ≥3
- [ ] Consultation (W14 พุธ): นำสถาปัตยกรรมของคน 1 (ที่ได้ข้อมูลจากคน 4) + Problem Statement ไปคุยกับอาจารย์ → จด feedback แจ้งเจ้าของ section
- [ ] Draft Report (W15) → แก้ตาม feedback → ฉบับสมบูรณ์ + สไลด์ (W16)
- [ ] เก็บ Peer Evaluation + Individual Reflection (5–10 บรรทัด) ครบทุกคน
- [ ] ซ้อมนำเสนอ: จับเวลา 15–20 นาที · ทุกคนพูด · ซ้อม Q&A จากคำถามที่เตรียมไว้ใน `01-docs.md`

## 6. Demo Day (W16) — สคริปต์สำรอง

1. ก่อนวันเสนอ: `pnpm db:reset && pnpm ledger:verify` → ระบบพร้อมสมบูรณ์
2. เดินตาม §21 ทั้ง 7 ขั้น (ผูกกับสไลด์ช่วง demo)
3. **Backup plan:** อัดวิดีโอ demo ทั้ง flow ไว้ 1 ไฟล์ (กรณีเครื่อง/เน็ตพัง) + screenshot สำรอง

## 7. จัดการความเสี่ยงของทีม (สิ่งที่ PM ต้องเฝ้า)

| สัญญาณ | การกระทำ |
|---|---|
| งานใดดีเลย์เกิน 1 วัน | ถามทันที + ปรับ dependency (เช่นคน 2 หันไปทำหน้าอื่นที่ไม่ต้องรอ) |
| Contract ขัดกันจริง (DTO ไม่พอ/ผิด) | คุณเป็นคนเดียวที่อนุมัติแก้ `00-shared-contract.md` — แก้แล้วประกาศให้ทั้งสองฝั่งรับทราบ |
| คน 4 ว่างระหว่างรอ QA | ให้ช่วยเขียนเอกสารเทคนิคส่วน block structure กับคน 1 ก่อน |
| e2e เดิมพังหลัง merge | หยุด merge PR ถัดไปจนกว่าจะเขียว — อย่าสะสม main สีแดง |
