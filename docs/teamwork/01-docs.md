# 01 — บทบาท: เอกสารทั้งหมด (Docs) + หน้าเว็บเนื้อหา

> **ให้ AI agent อ่านก่อน:** `AGENTS.md` → skill `web-ui-coding-standards` → `docs/teamwork/00-shared-contract.md` (สัญญากลาง) → ไฟล์นี้
> อ้างอิงหลัก: `docs/project-understanding.md` (ข้อกำหนด/กติกา/rubric ของอาจารย์) และ `docs/system-design.md`

## ภาพรวมงานคุณ

คุณรับผิดชอบ **ผลงานเอกสารทั้งหมดของรายวิชา** (รายงาน 10–15 หน้า + สไลด์ + references) และหน้าเว็บเนื้อหา 2 หน้า (`about`, `privacy`) — งานนี้ไม่ต้องรอใคร เริ่มได้ทันทีวันแรก

**ห้ามแตะไฟล์อื่นทั้งหมด** ยกเว้น: `docs/report/**`, `app/pages/about.vue`, `app/pages/privacy.vue`

---

## ส่วน A — งานเอกสาร (หลัก · ส่งเป็นไฟล์ Markdown ที่ `docs/report/`)

> PM จะประกอบไฟล์ของคุณเป็นรายงานเล่มเดียว — เขียนเป็น Markdown หัวข้อชัด ไม่ต้องจัดหน้าเล่ม

### A1. `docs/report/01-problem-statement.md` — ส่งสิ้นสัปดาห์ 13 (งานแรกสุดของรายวิชา)

เขียนให้ครบทุกข้อบังคับจาก project-understanding "Mandatory Requirements":

- [ ] **ปัญหาด้วยข้อมูลจริงบุรีรัมย์** — สถิติผ้าไหม/OTOP บุรีรัมย์/ข่าวปลอมแปลง พร้อมแหล่งอ้างอิงทุกจำนวนตัวเลข (ห้ามอ้างเลขลอย)
- [ ] **ระบบเดิมและช่องว่าง** — อธิบายวิธีทำงานปัจจุบัน (กระดานบันทึก/ใบรับรองกระดาษ/ไลน์กลุ่ม) และช่องว่างของมัน
- [ ] **SQL Counterfactual** — ตอบตรง ๆ ว่าถ้าใช้ MySQL/PostgreSQL จะเกิดปัญหาอะไร (ใครเป็นเจ้าของ DB, ใครแก้ประวัติย้อนหลังได้, ทำไมหลายองค์กรไม่ยอมให้อีกฝ่ายถือข้อมูล) และ**ยอมรับอย่างเป็นธรรม**ว่าถ้าทุกฝ่ายเชื่อสหกรณ์เดียว SQL อาจพอ (rubric ให้คะแนนความสมเหตุสมผล ไม่ใช่การชูช้า blockchain)
- [ ] **Trust Problem** — ระบุชัดว่า 2–3 องค์กรใดจำเป็นต้องใช้บันทึกร่วมกันและไม่มีใครควรแก้ประวัติทั้งหมดได้ลำพัง
- [ ] **ขอบเขตการรับรอง** — ใบรับรองยืนยัน "ผู้ทอ แหล่งผลิต ผู้ตรวจรับ วันที่" ไม่ใช่คุณภาพแท้ทั้งหมด
- [ ] ความยาวรวมประมาณ 2–3 หน้า (เมื่อแปลงเป็นเอกสาร)

### A2. `docs/report/benchmark-table.md` — ส่งสิ้นสัปดาห์ 13

- [ ] เลือกกรณีศึกษา traceability จริง 2–3 ราย (เช่น Provenance อาหารทะเล, เกษตร/สินค้า OTOP, เพชร)
- [ ] ตารางเปรียบเทียบมิติ: Trust Model · Blockchain Type/Consensus · On/Off-chain data · ข้อจำกัด — แล้วสรุปว่าผ้าไหมเราต่าง/เหมือนอะไร
- [ ] **ห้ามคัดลอก** — สรุปด้วยคำของทีม และอ้างอิงถูกคน

### A3. `docs/report/02-solution-architecture.md` — สัปดาห์ 14 (หลังสัมภาษณ์คน 4)

- [ ] **System Architecture Diagram** (mermaid) — แสดง: Stakeholder 3 กลุ่ม, จุดส่ง transaction (เว็บ), Nuxt app + API, PostgreSQL (ข้อมูลธุรกิจ + ledger), Validator 3 โหนด (Local Simulation), On-chain vs Off-chain storage, QR verification path
- [ ] **Blockchain Type = Consortium** — เหตุผลผูกกับ: ใครเขียนได้, ใครตรวจได้, ใครคุมโหนด, ความไว้วางใจระหว่างองค์กร
- [ ] **Consensus = PoA** — เหตุผลผูกกับ: validator จำนวนน้อย (3) ที่รู้ตัวตน, ไม่ต้องใช้เหรียญ, ต้นทุนเหมาะกับโครงงาน
- [ ] **วิเคราะห์ความเสี่ยง PoA** — การสมรู้ร่วมคิดของ validator, validator key ถูกยึด, การบริหารสมาชิก (ห้ามวิเคราะห์ 51% attack — นั่นของ PoW)
- [ ] **Block Structure ทุก field** — Index, Timestamp, Data Fields (เก็บอะไร), Nonce (**ความหมายตามบริบท PoA** — ตัวนับรอบของ validator ไม่ใช่การขุด), Hash, Previous Hash — ขอตัวจริงจากคน 4 ให้ตรงกับโค้ด `ledger.service.ts`
- [ ] **On-chain vs Off-chain** — on-chain: certificate code, hash, pseudonymous ID, timestamp; off-chain: ชื่อจริง, ไฟล์ภาพ, เอกสาร (อิง `docs/system-design.md` §10)
- [ ] **Smart Contract Pseudo-code** — แปลงจาก system-design §11 (มี REQUIRE role/ownership/state, if/then, เปลี่ยนสถานะ, คืนผลลัพธ์, บันทึก event) — **ห้ามเขียนด้วย Solidity** เป็นข้อบังคับของอาจารย์
- [ ] ตรวจว่าชื่อ actor/สถานะทุกอย่างตรงกับ Transaction Flow (A4) และตรงกับโค้ดจริง

### A4. `docs/report/03-actors-and-transaction-flow.md` — สัปดาห์ 14 (หลังสัมภาษณ์คน 3)

- [ ] **ตาราง Stakeholders 3–5 กลุ่ม** — ช่างทอ/สหกรณ์/ร้านค้า/ผู้บริโภค (+validator ในมุม simulation): บทบาท, สิทธิ์, **ทำอะไรไม่ได้** (อิง system-design §4 — ให้ตรงกับ RBAC ที่คน 3 implement)
- [ ] **Transaction Flow Diagram 8 ขั้น** (mermaid sequenceDiagram): ช่างทอส่งคำขอ → ระบบตรวจสิทธิ์ → สหกรณ์ตรวจ/อนุมัติ → สร้าง event → validator (PoA) ลงนาม block → บันทึกลง chain → คืนผลลัพธ์ → ผู้บริโภคสแกน QR ตรวจย้อนได้
- [ ] ใช้ชื่อสถานะจริงจาก Contract C (`DRAFT→SUBMITTED→APPROVED→...`, `ACTIVE/SUSPENDED/REVOKED`)

### A5. `docs/report/04-feasibility-ethics.md` — สัปดาห์ 14

- [ ] **Cost-Benefit vs Centralized SQL 8 มิติ**: โครงสร้างพื้นฐาน · ค่า validator/บริหารสมาชิก · ฝึกอบรม · ความซับซ้อน · ความเร็ว · ความสามารถตรวจย้อนหลัง · การพึ่งพาองค์กรกลาง · ความคุ้มค่าตามผู้ใช้จริง — หาอ้างอิงราคาจริง (VPS ฯลฯ)
- [ ] **PDPA**: วัตถุประสงค์, ข้อมูลส่วนบุคคลที่เก็บ, ใครเข้าถึงอะไร, การขอ/เพิกถอนความยินยอม
- [ ] **Right to be Forgotten vs Immutability** — ทางออกของทีม: แก้/ลบได้เฉพาะข้อมูล PII ฝั่ง off-chain; บน chain เก็บเฉพาะ hash/pseudonymous ID จึงไม่ใช่ข้อมูลส่วนบุคคลโดยตรง
- [ ] **พ.ร.ก. สินทรัพย์ดิจิทัล 2561** — สรุปพร้อมเหตุผลว่าไม่เกี่ยว (ระบบไม่มี token/crypto/NFT)
- [ ] ประเด็นจริยธรรม: ช่างทอรายย่อยเข้าถึงเทคโนโลยี, ความเสี่ยงถูกกีดกัน

### A6. `docs/report/05-limitations-future-work.md` — สัปดาห์ 14–15

- [ ] ข้อจำกัด 3 ด้าน: Technical (**เป็น Local Simulation ไม่ใช่ distributed network จริง**, validator 3 โหนดในเครื่องเดียว), Financial, Regulatory
- [ ] **Oracle / Garbage-in-garbage-out** — blockchain ไม่รับประกันว่าผ้าจริงตรงข้อมูลที่กรอก
- [ ] **QR Code Duplication** — QR คัดลอกได้ ไม่ป้องกันของปลอมได้ทั้งหมด
- [ ] Future Work: pilot จริงกับสหกรณ์, เพิ่ม validator หลายองค์กร, mobile app — แยกจาก scope ปัจจุบันให้ชัด

### A7. สไลด์นำเสนอ — สัปดาห์ 15–16 (ไฟล์ `docs/report/slides-outline.md` โครงก่อน)

- [ ] โครง 15–20 นาที: ปัญหา (3 นาที) → ทำไม Blockchain/Consortium/PoA (4) → Architecture + Block structure (4) → **Demo เว็บ** (5) → ความเสี่ยง/ข้อจำกัด (2) → สรุป
- [ ] ทุกคนมีส่วนพูด; เตรียมคำตอบ Q&A: "ทำไมไม่ใช้ SQL", "simulation จริงไหม", "QR คัดลอกได้ไหม", "ผ้าปลอมแปลงมีหลักฐานไหม"

### วิธีเก็บข้อมูลจากเพื่อน (บังคับ — ห้ามเขียนเดา)

| จะเขียน | ต้องถามใคร | ถามอะไร |
|---|---|---|
| A3 Architecture | คน 4 (Blockchain) | โครง block จริง, สูตร hash, วิธีเลือก validator, ตัวเลข nonce |
| A4 Flow/ตารางสิทธิ์ | คน 3 (Backend) | endpoint จริง, วิธีตรวจสิทธิ์, สถานะที่เปลี่ยนจริง |
| Demo ในสไลด์ | คน 2 (Frontend) | flow หน้าจริง, หน้าไหนสวยสะดุดตา |

### References — ใส่ที่ `docs/report/references.md` (มีไฟล์แล้ว)

- เป้า ≥8 แหล่ง · Primary ≥3 (สัมภาษณ์/สถิติราชการ/เอกสารโครงการ) · APA 7 ทั้ง in-text และ list · ห้าม Wikipedia/Blog เป็นแหล่งหลัก
- ทุกจำนวนตัวเลข/ข้อกล่าวอ้างในเนื้อหาต้องมี citation กำกับ

---

## ส่วน B — งานโค้ด 2 หน้า (เบา · ทำช่วงรอข้อมูล)

ตามมาตรฐาน skill: ใช้ semantic token (`bg-primary`, `text-info-700`), Lucide icons, ห้าม hard-code palette

### B1. `app/pages/about.vue` — หน้า "ระบบทำงานอย่างไร" เนื้อหาจริง

โครงมีแล้ว (หัวเรื่อง + 3 ขั้นตอน) — เติมส่วนเพิ่ม:

- [ ] ส่วนอธิบาย **On-chain vs Off-chain**: ตารางเทียบ "อะไรอยู่บน Ledger (certificate code, hash, timestamp — แก้ไม่ได้)" vs "อะไรอยู่ในฐานข้อมูลปกติ (ข้อมูลผ้า, ไฟล์ภาพ — แก้ไขได้ตามสิทธิ์)"
- [ ] ส่วน **ขอบเขตการรับรอง**: ใบรับรองยืนยันผู้ทอ/แหล่งผลิต/ผู้ตรวจรับ — ไม่ใช่การรับรองคุณภาพทั้งหมด
- [ ] ส่วน **ข้อจำกัดที่ควรรู้**: QR คัดลอกได้, ระบบนี้เป็น Local Simulation เพื่อการศึกษา (ใช้ badge `info` token กำกับ)
- [ ] Responsive ทั้ง 375/768/1440 ไม่ overflow, ผ่าน keyboard

### B2. `app/pages/privacy.vue` — ประกาศความเป็นส่วนตัวเนื้อหาจริง

- [ ] วัตถุประสงค์การเก็บข้อมูล (ออกใบรับรอง/ตรวจสอบย้อนหลัง)
- [ ] ตารางข้อมูลที่เก็บ: ประเภท · ที่เก็บ (on-chain hash เท่านั้น / off-chain DB) · ผู้เข้าถึงได้
- [ ] สิทธิเจ้าของข้อมูลตาม PDPA (ขอดู/แก้ไข/ขอลบ — ย้ำว่าข้อมูล on-chain เป็น hash ไม่ใช่ข้อมูลส่วนบุคคลโดยตรง)
- [ ] ช่องทางติดต่อ (สมมติ: สหกรณ์ผ้าไหมบุรีรัมย์ + อีเมลสมมติ)

---

## เกณฑ์เสร็จ (Definition of Done)

- [ ] ไฟล์ `docs/report/` ครบทั้ง 7 + references ≥8 แหล่ง (Primary ≥3)
- [ ] ทุก section ใช้ชื่อ actor/สถานะ **ชุดเดียวกัน** (ตรวจด้วยการค้นหาคำเดียวกันในทุกไฟล์ เช่น "ช่างทอ" ไม่ใช่บ้างทอ บ้างผู้ทอ)
- [ ] `pnpm typecheck && pnpm lint` ผ่าน (มีโค้ด 2 หน้า)
- [ ] หน้า about/privacy เปิดดูได้ สวยทั้ง mobile/desktop
- [ ] ทุกตัวเลข/ข้อกล่าวอ้างมี citation

## ถ้าติดขัด

- เพื่อนยังไม่ส่งข้อมูลที่ต้องสัมภาษณ์ → เขียนร่างจาก `docs/system-design.md` ก่อน ใส่หมายเหตุ `[TODO: ยืนยันกับเจ้าของโค้ด]` แล้วตามเก็บทีหลัง
- ขัดกับ system-design → ถาม PM
