# Team Charter (ข้อตกลงการทำงานร่วมกันของทีม)

> **รายวิชา:** 4124301 เทคโนโลยีบล็อกเชนและการเข้ารหัสลับ (Blockchain Technology and Cryptography)  
> **หัวข้อโครงงาน:** ระบบตรวจสอบและรับรองแหล่งที่มาของผ้าไหมทอมือบุรีรัมย์ด้วยเทคโนโลยีบล็อกเชน (Buriram Silk Traceability on Local Consortium Blockchain)  
> **กำหนดส่ง:** สัปดาห์ที่ 13 (Research & Ideation)

---

## 1. ข้อมูลสมาชิกและบทบาทหน้าที่ในทีม (Team Members & Roles)

ทีมประกอบด้วยสมาชิก 5 คน โดยมีการจัดสรรบทบาทหน้าที่ที่ชัดเจนตามความเชี่ยวชาญ:

| ลำดับ | บทบาทหน้าที่ (Role) | สมาชิกผู้รับผิดชอบ | ขอบเขตความรับผิดชอบหลัก |
|:---:|---|---|---|
| 1 | **Business Analyst & Documentation Lead** (นักวิเคราะห์ธุรกิจและหัวหน้างานเอกสาร) | คนที่ 1 | • วิเคราะห์ปัญหาธุรกิจ ข้อมูลสถิติ OTOP บุรีรัมย์ และ Trust Model<br>• รับผิดชอบเนื้อหารายงานหลัก 10–15 หน้า และสไลด์นำเสนอ<br>• จัดการหน้าเว็บ `/about` และ `/privacy` (PDPA) |
| 2 | **Frontend Developer & UI/UX Specialist** (นักพัฒนาส่วนติดต่อผู้ใช้) | คนที่ 2 | • พัฒนาเว็บแอปพลิเคชัน Nuxt 4 (Vue 3 Composition API + Tailwind CSS)<br>• ออกแบบ Public Verification Page, Dashboard (Weaver, Officer, Store)<br>• พัฒนาระบบสแกนและสร้าง QR Code สำหรับตรวจสอบย้อนกลับ |
| 3 | **Backend & API Engineer** (วิศวกรระบบหลังบ้านและฐานข้อมูล) | คนที่ 3 | • ออกแบบและจัดการฐานข้อมูล PostgreSQL 17 + Prisma ORM<br>• พัฒนา Nitro Server API Routes สำหรับ Authentication, RBAC, Data Mutation<br>• ควบคุม Business Logic และ Data Validation ฝั่งเซิร์ฟเวอร์ |
| 4 | **Blockchain & QA Engineer** (วิศวกรบล็อกเชนและประกันคุณภาพ) | คนที่ 4 | • พัฒนา Local Consortium Blockchain Simulator (SHA-256 + Ed25519 PoA)<br>• เขียน Smart Contract Business Rules ในรูป Pseudo-code<br>• พัฒนาระบบ Automated Test (Unit, Integration, E2E) และ Chain Integrity Verification |
| 5 | **Project Manager & Integration Lead** (ผู้จัดการโครงงานและประสานงาน) | คนที่ 5 | • ควบคุม Timeline และคุณภาพการส่งมอบตาม Rubric อาจารย์<br>• ประสานงานการรวมระบบ (Integration) และตรวจสอบ Docker Deployment<br>• ดำเนินการประชุม ติดตามงาน และประสานงานส่งรายงาน |

---

## 2. เป้าหมายและมาตรฐานคุณภาพของทีม (Team Goals & Quality Standards)

1. **เป้าหมายผลการประเมิน:** มุ่งหวังคะแนนระดับสูงสุด (Excellent / ระดับ 4) ในทุกมิติของเกณฑ์การให้คะแนน (Rubric) รวม 20% ของรายวิชา
2. **ความสมเหตุสมผลของการใช้บล็อกเชน (Justification):** เริ่มต้นจากปัญหาจริงในพื้นที่บุรีรัมย์ ไม่ใช่เริ่มจากความอยากใช้เทคโนโลยี และเปรียบเทียบกับระบบฐานข้อมูล SQL อย่างเป็นธรรม
3. **การทำงานร่วมกันแบบสมดุล (Equal Participation):** สมาชิกทุกคนต้องเข้าใจภาพรวมระบบครบทุกมิติ สามารถตอบคำถามและมีส่วนร่วมในการนำเสนอ 15–20 นาที และช่วง Q&A 5 นาที
4. **มาตรฐานโค้ดและการส่งมอบ (Definition of Done):** โค้ดทั้งหมดต้องผ่านเกณฑ์ `pnpm typecheck`, `pnpm lint`, `pnpm test` และสามารถรันได้ด้วยคำสั่งเดียวผ่าน Docker

---

## 3. กฎและข้อตกลงในการทำงานร่วมกัน (Team Working Agreements & Rules)

### 3.1 การสื่อสารและการประชุม (Communication & Meetings)
* **ช่องทางหลัก:** กลุ่ม Discord / Line สำหรับการสื่อสารประจำวัน และ GitHub Repository สำหรับการจัดการงานและโค้ด
* **การประชุมติดตามความคืบหน้า (Standup Meeting):** สัปดาห์ละ 2 ครั้ง (วันพุธหลังเรียน และวันอาทิตย์ช่วงค่ำ) ครั้งละ 30 นาที เพื่ออัปเดตงานและแก้ไขจุดติดขัด (Blockers)
* **การนัดหมาย Consultation กับอาจารย์:** เตรียมประเด็นคำถามและเอกสารล่วงหน้าก่อนเข้าพบอาจารย์ในสัปดาห์ที่ 14 และ 15

### 3.2 การตัดสินใจและการแก้ไขข้อขัดแย้ง (Decision Making & Conflict Resolution)
* ใช้หลักการตัดสินใจโดยอิงจาก **Project Brief, System Design และ Rubric ของอาจารย์เป็นที่ตั้ง (Data-driven & Criteria-based)**
* หากมีความเห็นต่าง ให้จัดประชุมชี้แจงเหตุผลและลงมติร่วมกัน หากยังไม่ได้ข้อสรุป ให้ Project Manager เป็นผู้ตัดสินใจเพื่อรักษาความคืบหน้าของโครงการ

### 3.3 ข้อตกลงด้าน Git และการพัฒนา (Git & Collaboration Policy)
* แตก Branch ตาม Feature / บทบาท เช่น `docs/report-part-1`, `feat/blockchain-simulator`
* ห้าม Commit ทับไฟล์ของบทบาทอื่นโดยไม่แจ้งล่วงหน้า (ยึดตาม Shared Contract `docs/teamwork/00-shared-contract.md`)
* ทุก Pull Request ต้องผ่านการรีวิวและผ่าน CI Test ก่อนผสานเข้าสู่ Branch หลัก (`main`)

---

## 4. การลงนามรับรองข้อตกลง (Signatures)

สมาชิกทุกคนได้รับทราบและตกลงที่จะปฏิบัติตาม Team Charter นี้อย่างเคร่งครัด:

* สมาชิกคนที่ 1 (Business Analyst & Documentation Lead): ____________________ วันที่ 22/08/2026
* สมาชิกคนที่ 2 (Frontend Developer): ____________________ วันที่ 22/08/2026
* สมาชิกคนที่ 3 (Backend & API Engineer): ____________________ วันที่ 22/08/2026
* สมาชิกคนที่ 4 (Blockchain & QA Engineer): ____________________ วันที่ 22/08/2026
* สมาชิกคนที่ 5 (Project Manager & Integration Lead): ____________________ วันที่ 22/08/2026
