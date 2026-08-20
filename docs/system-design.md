# Web System Design: ระบบตรวจสอบและรับรองแหล่งที่มาของผ้าไหมทอมือบุรีรัมย์

สถานะเอกสาร: **Nuxt Web Implementation Design — ล็อกขอบเขตเป็น Web-only, PostgreSQL และ Local Blockchain Simulation**

เอกสารอ้างอิงหลัก:

- `docs/blockchain_project_brief.pdf`
- `docs/project-understanding.md`

## 1. Intent

สร้างเว็บด้วย **Nuxt** ที่สาธิตกระบวนการลงทะเบียนผ้าไหม การตรวจและออกใบรับรอง การส่งมอบให้ร้านค้า และการตรวจสอบแหล่งที่มาได้จริง โดยใช้ Blockchain เป็น Shared Audit Trail เฉพาะเมื่อมีหลายองค์กรที่จำเป็นต้องร่วมกันรับรองข้อมูลและไม่ควรให้องค์กรเดียวแก้ประวัติได้โดยลำพัง

เว็บ Nuxt เป็น Implementation Scope ของทีมตามคำชี้แจงเพิ่มเติมจากอาจารย์ว่าระบบเว็บที่ใช้งานได้มีโอกาสได้รับคะแนนเพิ่ม ส่วน Blueprint, เหตุผลการใช้ Blockchain และความถูกต้องเชิงสถาปัตยกรรมยังเป็นเกณฑ์หลักตามเอกสาร PDF

## 2. Final Architecture Decisions

| ประเด็น | ข้อสรุป |
|---|---|
| Client | Responsive Web เท่านั้น ไม่มี Mobile Application แยก |
| Application | Nuxt 4 แบบ Full-stack หนึ่ง Codebase |
| Package Manager | pnpm |
| Database | PostgreSQL |
| Local Database | Docker Compose |
| Data Access | Prisma ORM + Migrations + Seed |
| Authentication | `nuxt-auth-utils` + Sealed Cookie Session |
| File Storage | Local Server Storage สำหรับ Demo; PostgreSQL เก็บ Metadata/Path ไม่เก็บไฟล์ก้อนใหญ่โดยตรง |
| Blockchain Type | Consortium Blockchain ใน Blueprint; Local Simulation ในเว็บ |
| Hashing | สร้าง Hash Chain จริงด้วย SHA-256 และตรวจ Chain Integrity ได้ |
| Consensus | Proof of Authority (PoA) แบบจำลองด้วย Authorized Validator Identities |
| Validator Roles | สหกรณ์ผ้าไหม, หน่วยงานตรวจรับรองท้องถิ่น, ตัวแทนเครือข่ายร้านค้า |
| Deployment | รันบนเครื่องหรือ Web Server เดียวสำหรับสาธิต |

ชื่อองค์กร Validator จริงยังต้องมีหลักฐานก่อนใช้ในรายงาน เว็บจึงใช้สามบทบาทข้างต้นเป็นข้อมูลจำลองและแสดงป้าย `Simulation` ชัดเจน

PostgreSQL จำเป็นเพราะระบบมีผู้ใช้หลายบทบาท ข้อมูลส่วนบุคคล Workflow การตรวจรับรอง การส่งมอบ และหน้าค้นหาสาธารณะ ส่วน Ledger Simulation ใช้ตาราง Append-only แยกจากตารางธุรกิจ แต่เขียนภายใน PostgreSQL Transaction เดียวกันเพื่อป้องกันข้อมูลครึ่งสำเร็จ

## 3. Scope

### 3.1 MVP

MVP รองรับกรณีผ้าไหม **หนึ่งผืนต่อหนึ่ง Silk Item และหนึ่ง Certificate ID** เพื่อให้ QR เชื่อมกับวัตถุทางกายภาพได้ตรงที่สุด

ฟังก์ชันใน MVP:

1. ช่างทอลงทะเบียนข้อมูลผ้าไหมและหลักฐาน
2. ช่างทอส่งคำขอรับรอง
3. สหกรณ์ตรวจ อนุมัติ หรือปฏิเสธ
4. ระบบออก Certificate ID และ QR Code เมื่อ Certificate กับ Ledger Block Commit สำเร็จพร้อมกัน
5. ผู้ดูแลปัจจุบันเริ่มส่งมอบให้ร้านค้า และร้านค้ายืนยันรับ
6. สหกรณ์ระงับหรือเพิกถอนใบรับรองพร้อมเหตุผล
7. ผู้บริโภคสแกน QR หรือกรอก Certificate ID เพื่อตรวจสอบ
8. ผู้มีสิทธิ์ดู Audit Trail

### 3.2 Out of Scope

- Marketplace และตะกร้าสินค้า
- Payment Gateway
- Cryptocurrency, Token และ NFT
- การประมูล
- การติดตามขนส่งแบบ Real-time
- Sales Status และระบบบัญชีร้านค้า
- Mobile Application แยกต่างหาก
- AI ตรวจลวดลายหรือคุณภาพผ้า
- IoT Tracking
- Self-service Registration สำหรับผู้มีสิทธิ์รับรอง
- การบันทึกทุกครั้งที่ผู้บริโภคสแกน QR ลง Blockchain

### 3.3 Domain Assumptions สำหรับ MVP

สมมติฐานต่อไปนี้ใช้พัฒนา MVP ได้ทันที แต่ต้องยืนยันถ้อยคำและชื่อองค์กรก่อนเขียนเป็นข้อเท็จจริงในรายงาน:

- หน่วยรับรองเป็นผ้าไหมหนึ่งผืน ไม่ใช่ Batch
- สหกรณ์เป็นผู้ตรวจและออกใบรับรองหลัก
- ร้านค้ายืนยันการรับมอบ แต่แก้ข้อมูลการผลิตหรือผลการรับรองไม่ได้
- ผู้บริโภคตรวจสอบได้โดยไม่ต้อง Login
- ระบบใช้ QR ที่มี Verification URL และ Certificate ID ไม่มีข้อมูลส่วนบุคคลหรือ Secret ใน QR
- Validator ใช้สามบทบาทจำลองตามหัวข้อ 8; ชื่อองค์กรจริงยังรอผลการสำรวจ Stakeholder

### 3.4 Technology Scope

- **Application:** Nuxt 4 แบบ Full-stack หนึ่ง Codebase
- **Language:** TypeScript
- **UI:** Vue Composition API, `<script setup lang="ts">`, Tailwind CSS และ Lucide Icons
- **Backend:** Nuxt Server Routes สำหรับ API, Validation และ Role-based Authorization
- **Persistence:** PostgreSQL + Prisma ORM พร้อม Migration และ Seed
- **Files:** Local Server Storage สำหรับ Demo โดย PostgreSQL เก็บ File Metadata, Path และ SHA-256 Hash
- **Authentication:** `nuxt-auth-utils` แบบ Sealed Cookie Session; Password Hashing และ Role ตรวจซ้ำฝั่ง Server
- **QR:** Verification URL ที่เปิด Public Certificate Page
- **Ledger:** Local Server-side Consortium/PoA Simulator ใช้ SHA-256, Ed25519 Signature, Validator Rotation และ Chain Integrity Check
- **Feedback:** `useToast()` สำหรับผลลัพธ์ Action และ `useConfirm()` สำหรับ Suspend/Revoke หรือ Action ที่ย้อนกลับยาก
- **Quality:** Type Check, Lint, Unit Tests, API Tests และ Browser Flow Tests

## 4. Actors และ Permissions

| Actor | ทำได้ | ทำไม่ได้ |
|---|---|---|
| ช่างทอ | สร้าง Draft, แก้ Draft, แนบหลักฐาน, ส่งคำขอ, ดูผล, แก้และส่งใหม่เมื่อถูกปฏิเสธ | อนุมัติคำขอ, ออก/เพิกถอนใบรับรอง, แก้ข้อมูลหลังออกใบรับรองโดยตรง |
| เจ้าหน้าที่สหกรณ์ | ดูคิวตรวจ, ตรวจหลักฐาน, อนุมัติ, ปฏิเสธ, ระงับ, เพิกถอน, ดู Audit Trail | อนุมัติโดยไม่มีเหตุผล/หลักฐาน, ลบประวัติ, แก้ Event ที่ยืนยันแล้ว |
| ร้านค้า | ตรวจใบรับรอง, รับคำขอส่งมอบ, ยืนยัน/ปฏิเสธการรับ, ดูสินค้าที่ตนดูแล | แก้ข้อมูลผู้ทอ, ออกใบรับรอง, เปลี่ยนสถานะใบรับรอง |
| ผู้บริโภค | ค้นหา/สแกนใบรับรอง, ดูข้อมูล Public และ Timeline ที่เปิดเผยได้ | เห็น PII/เอกสารภายใน, เขียน Transaction, เปลี่ยนสถานะ |

## 5. Web Information Architecture

### 5.1 Public Routes

| Route เชิงแนวคิด | หน้า | ความสามารถ |
|---|---|---|
| `/` | Home | อธิบายระบบ, ค้นหา Certificate ID, เปิดกล้องสแกน QR |
| `/verify` | Verify | กรอก Certificate ID หรือรับค่าจาก QR |
| `/certificate/:id` | Certificate Detail | แสดงผล Valid/Inactive/Not Found, ข้อมูลผ้า, Issuer, Custody Timeline และ Hash Summary |
| `/ledger` | Blockchain Explorer | แสดง Block, Validator, Hash และผล Chain Integrity พร้อมป้าย Simulation |
| `/ledger/:index` | Block Detail | แสดง Block Header, Event, Previous Hash และ Signature Verification |
| `/about` | How It Works | อธิบาย On-chain/Off-chain, ขอบเขตการรับรอง และข้อจำกัด QR/Blockchain |
| `/privacy` | Privacy Notice | แจ้งวัตถุประสงค์ ข้อมูลที่ใช้ และช่องทางใช้สิทธิ |

### 5.2 Authenticated Routes

| Route เชิงแนวคิด | Role | หน้า/ความสามารถ |
|---|---|---|
| `/login` | ทุก Role ภายใน | Login |
| `/weaver` | ช่างทอ | Dashboard และสรุป Draft/Submitted/Certified/Rejected |
| `/weaver/items/new` | ช่างทอ | ลงทะเบียนผ้าไหม |
| `/weaver/items/:id` | ช่างทอ | ดู Draft, หลักฐาน, ผลตรวจ และ Revision |
| `/review` | สหกรณ์ | คิวคำขอรอตรวจ |
| `/review/:requestId` | สหกรณ์ | ตรวจข้อมูล อนุมัติ หรือปฏิเสธ |
| `/certificates/:id/manage` | สหกรณ์ | ระงับ/คืนสถานะ/เพิกถอนพร้อมเหตุผล |
| `/transfers` | ช่างทอ/สหกรณ์/ร้านค้า | รายการส่งมอบที่เกี่ยวข้องกับตน |
| `/transfers/:id` | ผู้ส่ง/ผู้รับ | ยืนยัน ปฏิเสธ หรือยกเลิกตามสิทธิ์ |
| `/audit/:silkItemId` | ผู้มีสิทธิ์ | Audit Trail ฉบับภายใน |

### 5.3 UI Standards

- ใช้ Vue Composition API และ `<script setup lang="ts">`
- ใช้ Tailwind CSS และ Design Tokens ชุดเดียวทั้ง Public Web และ Dashboard
- ใช้ Lucide Icons เท่านั้น; Icon-only Button ต้องมี `aria-label`
- ใช้ `useToast()` สำหรับ Success/Error ของ Action และ Inline Error สำหรับ Validation ของ Field
- ใช้ `useConfirm()` ก่อน Suspend, Reactivate, Revoke และ Cancel Transfer; ไม่ใช้ `alert()` หรือ `confirm()` ของ Browser
- ทุกหน้าต้องมี Loading, Empty, Error, Permission Denied และ Responsive State ที่เหมาะสม
- Form ต้องมี Label ที่มองเห็นได้, Required/Optional ชัดเจน, รักษาค่าที่กรอกเมื่อ Error และป้องกัน Submit ซ้ำ
- Status ต้องมีทั้งข้อความและ Visual Indicator ไม่ใช้สีอย่างเดียว
- Dashboard ใช้ Sidebar บน Desktop และ Drawer บนจอแคบ; Public Web ใช้ Top Navigation
- ตรวจ Keyboard Navigation, Focus-visible, Heading Order, Contrast และข้อความยาวภาษาไทย

### 5.4 หน้าที่ตัดออกจาก MVP

- หน้าร้านค้าออนไลน์
- หน้าชำระเงิน
- หน้าสถิติการขาย
- หน้าจัดส่งสินค้า
- หน้าสาธารณะสำหรับร้องเรียน เพราะต้องเพิ่ม Moderation, Evidence Handling และ Privacy Workflow
- หน้าบริหาร Validator; Validator จำลองถูกสร้างด้วย Seed และไม่แก้ผ่าน UI

### 5.5 API Contract

| Method และ Endpoint | Role | ผลลัพธ์หลัก |
|---|---|---|
| `POST /api/auth/login` | Public | ตรวจรหัสผ่านและสร้าง Sealed Cookie Session |
| `POST /api/auth/logout` | Authenticated | ล้าง Session |
| `GET /api/auth/session` | Authenticated | คืน User ID, Role และ Organization ที่จำเป็น |
| `GET /api/silk-items` | Weaver/Officer/Store | คืนรายการตามสิทธิ์และ Filter |
| `POST /api/silk-items` | Weaver | สร้าง Draft |
| `GET /api/silk-items/:id` | Authorized | คืนรายละเอียด Revision, Evidence และ Status |
| `PATCH /api/silk-items/:id` | Owner Weaver | แก้ได้เฉพาะ Draft |
| `POST /api/silk-items/:id/evidence` | Owner Weaver | Upload ไฟล์และบันทึก SHA-256 Hash |
| `POST /api/silk-items/:id/submit` | Owner Weaver | ล็อก Revision และสร้าง Certification Request |
| `GET /api/reviews` | Cooperative Officer | คืนคิวคำขอรอตรวจ |
| `POST /api/reviews/:id/approve` | Cooperative Officer | สร้าง Certificate และ `ISSUE_CERTIFICATE` Block แบบ Atomic |
| `POST /api/reviews/:id/reject` | Cooperative Officer | ปฏิเสธพร้อม Reason Code และ Review Note |
| `POST /api/certificates/:id/status` | Cooperative Officer | Suspend/Reactivate/Revoke และสร้าง Block แบบ Atomic |
| `GET /api/public/certificates/:code` | Public | คืนเฉพาะ Public DTO และผล Chain Integrity |
| `POST /api/transfers` | Current Custodian | สร้าง Pending Transfer |
| `POST /api/transfers/:id/accept` | Recipient | ยืนยันรับ เปลี่ยน Custodian และสร้าง Block แบบ Atomic |
| `POST /api/transfers/:id/reject` | Recipient | ปฏิเสธ Pending Transfer |
| `GET /api/ledger/blocks` | Public | คืนรายการ Block ที่ตัด PII ออกแล้ว |
| `GET /api/ledger/blocks/:index` | Public | คืนรายละเอียด Block และผลตรวจ Signature |
| `GET /api/ledger/verify` | Public | ตรวจ Hash Chain, Nonce, Rotation และ Signature ทั้ง Chain |

ทุก Mutation Endpoint ต้องตรวจ Session, Role, Ownership, State Transition, Schema Validation และ Idempotency ฝั่ง Server แม้หน้าเว็บจะซ่อนปุ่มแล้วก็ตาม

รูปแบบ Error Response กลาง:

```text
{
  code: "CERTIFICATE_ALREADY_EXISTS",
  message: "ผ้าไหมรายการนี้มีใบรับรองแล้ว",
  fieldErrors?: { fieldName: "ข้อความที่ช่วยให้แก้ไขได้" }
}
```

### 5.6 Project Structure

```text
app/
  components/
    ui/                    # Button, Input, Dialog, Toast, StatusBadge
    domain/                # SilkItemCard, CertificateTimeline, BlockHash
  composables/
    useToast.ts
    useConfirm.ts
  layouts/
    default.vue            # Public top navigation
    dashboard.vue          # Sidebar + responsive drawer
  middleware/
    auth.ts
    role.ts
  pages/                   # Routes ตามหัวข้อ 5.1–5.2
  utils/                   # Pure presentation/format utilities
server/
  api/                     # Endpoint ตามหัวข้อ 5.5
  services/
    certification.service.ts
    transfer.service.ts
    ledger.service.ts
  utils/
    db.ts                  # Prisma client singleton
    auth.ts                # Session/role helpers
    validation.ts
  middleware/
shared/
  types/                   # DTO, Role, Status, Event Type
  utils/                   # Pure canonical serialization/hash input helpers
prisma/
  schema.prisma
  migrations/
  seed.ts
storage/uploads/           # Server-only, ไม่เปิดเป็น static directory
test/
  unit/
  integration/
  e2e/
```

ไม่สร้าง Generic Repository Layer ใน MVP ให้ Service ใช้ Prisma ผ่าน `server/utils/db.ts` โดยตรงภายในขอบเขต Transaction เพื่อลด Abstraction ที่ยังไม่มีความจำเป็น

## 6. Core User Flows

### 6.1 ลงทะเบียนและออกใบรับรอง

```mermaid
sequenceDiagram
    actor W as ช่างทอ
    participant Web as Web App
    participant API as Backend API
    participant Store as PostgreSQL/Local Storage
    participant Ledger as Local Blockchain Simulator
    actor C as สหกรณ์

    W->>Web: กรอกข้อมูลและแนบหลักฐาน
    Web->>API: Save draft
    API->>Store: บันทึก Draft และไฟล์
    W->>Web: Submit for certification
    Web->>API: ส่งคำขอพร้อม Idempotency Key
    API->>Store: ล็อก Revision และตั้ง SUBMITTED
    C->>Web: เปิดคำขอและตรวจหลักฐาน
    C->>API: Approve พร้อมเหตุผล
    API->>Store: เริ่ม PostgreSQL Transaction
    API->>Ledger: สร้างและลงนาม ISSUE_CERTIFICATE Block
    Ledger-->>API: Transaction ID / Block Hash
    API->>Store: สร้าง Certificate เป็น ACTIVE และ Commit
    API-->>Web: แสดง Certificate ID และ QR
    Note over API,Store: ถ้าสร้าง Block ไม่สำเร็จ ให้ Rollback ทั้งหมด
```

### 6.2 ปฏิเสธและส่งใหม่

1. สหกรณ์ปฏิเสธคำขอพร้อม Reason Code และข้อความอธิบาย
2. ระบบบันทึก Review Event โดยไม่ลบ Submission เดิม
3. ช่างทอสร้าง Revision ใหม่จากข้อมูลเดิม
4. ช่างทอแก้เฉพาะข้อมูลที่อนุญาตและส่งใหม่
5. ระบบสร้าง Certification Request ใหม่ที่อ้างถึง Revision ก่อนหน้า

### 6.3 ส่งมอบให้ร้านค้า

```mermaid
sequenceDiagram
    actor S as ผู้ดูแลปัจจุบัน
    actor R as ร้านค้า
    participant API as Backend API
    participant Ledger as Local Blockchain Simulator

    S->>API: Initiate transfer to ร้านค้า
    API->>API: ตรวจว่า Certificate ACTIVE และผู้ส่งเป็น Custodian
    API->>Ledger: บันทึก TRANSFER_INITIATED
    R->>API: Accept หรือ Reject
    alt Accept
        API->>API: เริ่ม PostgreSQL Transaction
        API->>Ledger: สร้าง TRANSFER_ACCEPTED Block
        Ledger-->>API: Block Hash
        API->>API: เปลี่ยน Current Custodian และ Commit
    else Reject
        API->>Ledger: บันทึก TRANSFER_REJECTED
    end
```

กฎสำคัญ:

- ห้ามมี Pending Transfer มากกว่าหนึ่งรายการต่อ Silk Item
- ผู้ส่งต้องเป็น Current Custodian
- ผู้รับต้องเป็น Organization/User ที่ได้รับอนุญาต
- Certificate ต้องเป็น `ACTIVE`
- Custodian เปลี่ยนใน Transaction เดียวกับการสร้าง `TRANSFER_ACCEPTED` Block; หากขั้นตอนใดล้มเหลวให้ Rollback

### 6.4 ผู้บริโภคตรวจสอบ

```mermaid
flowchart LR
    A["สแกน QR หรือกรอก Certificate ID"] --> B["อ่าน Public Read Model"]
    B --> C{"พบใบรับรองหรือไม่"}
    C -->|ไม่พบ| D["แสดง Not Found และคำเตือน"]
    C -->|พบ| E["ตรวจสถานะและ Ledger Reference"]
    E --> F{"ACTIVE หรือไม่"}
    F -->|ใช่| G["แสดง Valid พร้อมข้อมูลแหล่งที่มา"]
    F -->|ไม่ใช่| H["แสดง Suspended/Revoked พร้อมเหตุผลสาธารณะที่เหมาะสม"]
```

การตรวจสอบเป็น Read-only Operation ไม่มี Blockchain Transaction ใหม่

## 7. State Models

### 7.1 Silk Item Revision

```text
DRAFT → SUBMITTED ─→ APPROVED
            │
            └─→ REJECTED ─→ สร้าง Revision ใหม่เป็น DRAFT
```

หลัง `APPROVED` ห้ามเขียนทับข้อมูลที่เป็น Claim สำคัญ หากต้องแก้ให้ใช้ Amendment หรือเพิกถอนแล้วออกใบรับรองใหม่

### 7.2 Certificate Status

```text
ACTIVE ↔ SUSPENDED → REVOKED
```

- `ACTIVE`: ตรวจสอบได้และใช้เริ่ม Transfer ได้
- `SUSPENDED`: หยุดใช้ชั่วคราว ระบุเหตุผลและผู้ดำเนินการ
- `REVOKED`: ยุติถาวร ไม่ย้อนกลับเป็น Active

### 7.3 Custody Transfer Status

```text
PENDING → ACCEPTED
    ├─→ REJECTED
    ├─→ CANCELLED
    └─→ EXPIRED
```

สถานะการขายไม่รวมอยู่ใน State Model นี้

## 8. Blockchain Type และ Consensus ที่เลือก

### 8.1 Consortium Blockchain

เลือก Consortium เพราะระบบกำหนดผู้มีสิทธิ์เขียนข้อมูลเป็นกลุ่มองค์กรที่รู้ตัวตน ได้แก่ สหกรณ์ ผู้ตรวจรับรอง และเครือข่ายร้านค้า บุคคลทั่วไปตรวจสอบใบรับรองได้แต่เขียน Ledger ไม่ได้ การกระจายสิทธิ์ระหว่างหลายบทบาทช่วยลดการพึ่งฐานข้อมูลที่องค์กรเดียวควบคุม

ชื่อองค์กรจริงยังต้องอ้างอิงหลักฐานในรายงาน เว็บใช้ชื่อบทบาทจำลองและไม่อ้างว่าองค์กรเหล่านั้นเข้าร่วมระบบจริงแล้ว

### 8.2 Proof of Authority (PoA)

เลือก PoA เพราะ Validator มีจำนวนน้อย ระบุตัวตนได้ ไม่ต้องใช้การขุด ไม่ต้องมีเหรียญ และเหมาะกับ Permissioned Network

การจำลองกำหนด Validator Roles 3 บทบาท:

1. `COOPERATIVE_AUTHORITY` — สหกรณ์ผ้าไหม
2. `LOCAL_CERTIFIER_AUTHORITY` — หน่วยงานตรวจรับรองท้องถิ่น
3. `RETAIL_NETWORK_AUTHORITY` — ตัวแทนเครือข่ายร้านค้า

Simulator เลือก Block Producer แบบ Round-robin ตาม Block Index ผู้ผลิต Block ลงนามด้วย Key จำลองของ Validator และระบบตรวจลายเซ็นกับ Public Key ที่บันทึกไว้ Block หนึ่งถือว่าถูกต้องเมื่อผู้ลงนามเป็น Validator ที่ Active และเป็นผู้ที่ถูกเลือกตามรอบ

Business Actor กับ Validator เป็นคนละหน้าที่ เช่น เจ้าหน้าที่สหกรณ์เป็นผู้อนุมัติใบรับรอง แต่ PoA Simulator เลือก Authority ตามรอบเพื่อผลิตและลงนาม Block ที่บรรจุ Event นั้น

ข้อจำกัด: Validator ทั้งสามทำงานอยู่ใน Nuxt Process และ PostgreSQL เดียวกัน จึงเป็นการสาธิต PoA Logic ไม่ใช่ Distributed Consensus จริง

### 8.3 เหตุผลที่ PostgreSQL อย่างเดียวไม่ใช่คำตอบของ Blueprint

PostgreSQL ยังจำเป็นสำหรับ Workflow, PII และการ Query แต่ Ledger Simulation เพิ่มหลักฐานแบบ Hash-linked และ Authority-signed ที่ตรวจการแก้ย้อนหลังได้ อย่างไรก็ตาม หากระบบจริงมีสหกรณ์เดียวเป็นผู้ควบคุมและทุกฝ่ายเชื่อถือองค์กรนั้น SQL + Signed Audit Log อาจคุ้มกว่าการตั้ง Consortium Network ประเด็นนี้ต้องระบุใน Cost-Benefit และ Limitations อย่างตรงไปตรงมา

## 9. Logical Architecture

```mermaid
flowchart TB
    Browser["Web Browser / Mobile Browser"]
    Nuxt["Nuxt Application\nPages + Components + Server Routes"]
    Auth["Session + RBAC"]
    DB["PostgreSQL\nPII + Workflow + Read Model"]
    Files["Local Server Storage\nรูปภาพและเอกสาร"]
    Service["Application Service\nBusiness Rules + DB Transaction"]
    Simulator["Local Blockchain Simulator\nSHA-256 + PoA Signature"]
    Blocks["PostgreSQL Append-only Ledger Tables"]

    Browser --> Nuxt
    Nuxt --> Auth
    Nuxt --> Service
    Service --> DB
    Nuxt --> Files
    Service --> Simulator
    Simulator --> Blocks
```

หลักการ:

- Nuxt เป็นทั้ง Web UI และ Backend API ของ MVP เพื่อลดจำนวน Application ที่ต้องดูแล
- Business Rules อยู่ฝั่ง Server Routes/Service Layer ไม่อยู่เฉพาะในหน้าเว็บ
- PostgreSQL เก็บ Workflow, PII และ Read Model รวมถึง Ledger Simulation ในตารางที่แยกหน้าที่กัน
- Local Server Storage เก็บไฟล์จริง; Ledger Simulation เก็บ SHA-256 Hash ของไฟล์
- Business Record และ Ledger Block ถูกเขียนใน PostgreSQL Transaction เดียวกัน หากคำนวณ Hash หรือลงนามไม่สำเร็จให้ Rollback ทั้งหมด
- `idempotency_key` และ Unique Constraint ป้องกันการ Submit/Approve ซ้ำ
- หน้าเว็บต้องติดป้ายว่า Transaction ID, Block Hash, Validator และ Consensus เป็น Simulation
- Simulator ต้องตรวจ `previous_hash`, Block Hash, Validator Rotation และ Signature เพื่อสาธิตว่าการแก้ย้อนหลังทำให้ Chain Invalid

## 10. Data Design

### 10.1 Core Entities

| Entity | หน้าที่ | ที่จัดเก็บหลัก |
|---|---|---|
| Organization | สหกรณ์ ร้านค้า หรือองค์กรเครือข่าย | PostgreSQL |
| User | บัญชี Role และความสัมพันธ์กับองค์กร | PostgreSQL |
| WeaverProfile | ข้อมูลช่างทอและข้อมูลส่วนบุคคล | PostgreSQL แบบจำกัดสิทธิ์ |
| SilkItem | รหัสผ้าและข้อมูลสาธารณะที่รับรอง | PostgreSQL + Hash/ID ใน Ledger Simulation |
| SilkItemRevision | Snapshot ของข้อมูลแต่ละ Revision | PostgreSQL; Hash ใน Ledger Simulation เมื่อ Submit/Approve |
| Evidence | Metadata และตำแหน่งไฟล์หลักฐาน | PostgreSQL/Local Storage; File Hash ใน Ledger Simulation |
| CertificationRequest | คำขอและผลการตรวจ | PostgreSQL + Event ที่จำเป็นใน Ledger Simulation |
| Certificate | Certificate ID, Issuer, Status | PostgreSQL Read Model + Ledger Simulation |
| CustodyTransfer | ผู้ส่ง ผู้รับ และสถานะการส่งมอบ | PostgreSQL + Ledger Event |
| LedgerEvent | Event แบบ Append-only | PostgreSQL Ledger Tables |

### 10.2 On-chain Data

- Event Type
- Silk Item ID
- Certificate ID เมื่อมี
- Issuer Organization ID
- Actor/Signer ID แบบที่ไม่เปิดเผย PII โดยตรง
- Evidence/Revision Hash
- Certificate Status Change
- Custody From/To Organization ID
- Timestamp
- Validator Nonce แบบเพิ่มทีละหนึ่งเพื่อป้องกัน Replay; ไม่ใช่ Mining Nonce
- Validator ID และ Digital Signature
- Transaction ID และ Block Reference

### 10.3 Off-chain Data

- ชื่อเต็ม ที่อยู่ เบอร์โทร และข้อมูลติดต่อช่างทอ
- Username, Password Hash และ Session
- รูปภาพความละเอียดสูง
- เอกสารหลักฐานฉบับเต็ม
- บันทึกภายในของเจ้าหน้าที่
- Consent Record และ Privacy Request
- Web Analytics
- Error Detail และ Operational Log

### 10.4 Block Structure สำหรับรายงาน

เอกสารโครงงานกำหนดให้ระบุฟิลด์ต่อไปนี้:

| Field | ความหมายใน Blueprint |
|---|---|
| Index | ลำดับ Block |
| Timestamp | เวลาที่ Block ได้รับการยืนยัน |
| Data Fields | รายการ Ledger Events เช่น Issue, Revoke, Transfer |
| Nonce | Sequence ของ Validator ที่เพิ่มทีละหนึ่ง ใช้ป้องกัน Replay ไม่ใช้สำหรับ Mining |
| Hash | Hash ของ Block ปัจจุบัน |
| Previous Hash | Hash ของ Block ก่อนหน้า |
| Validator ID | Authority ที่ได้รับเลือกให้ผลิต Block ตามรอบ |
| Signature | ลายเซ็นของ Validator บน Block Hash |

โครงสร้างนี้เป็นแบบจำลองตาม Requirement ของรายวิชา ไม่ควรอ้างว่าเป็น Field จริงของ Platform ใดจนกว่าจะเลือก Platform

### 10.5 Local Blockchain Simulation Tables

| Table | ข้อมูลสำคัญ | กฎ |
|---|---|---|
| `ledger_blocks` | `index`, `timestamp`, `data_hash`, `nonce`, `previous_hash`, `hash`, `validator_id`, `signature` | Append-only; ห้าม Update/Delete ผ่าน Application |
| `ledger_events` | `event_type`, `aggregate_id`, `payload`, `actor_id`, `block_id` | Event ต้องอ้างถึง Block ที่ยืนยันแล้ว |
| `ledger_validators` | `validator_id`, `name`, `authority_role`, `public_key`, `nonce`, `active` | เก็บ Public Key และลำดับ Nonce; Private Key อยู่ฝั่ง Server เท่านั้น |

สูตรคำนวณเชิงแนวคิด:

```text
hash = SHA256(index + timestamp + canonicalData + nonce + previousHash + validatorId)
signature = Ed25519Sign(hash, validatorPrivateKey)
```

`canonicalData` ต้อง Serialize แบบคงที่ มิฉะนั้นข้อมูลเดียวกันอาจได้ Hash ต่างกัน การตรวจ Chain Integrity ต้องคำนวณ Hash ทุก Block ใหม่ ตรวจ `previous_hash`, Validator Rotation, Nonce และ Signature ด้วย Public Key

### 10.6 Database Rules และ Constraints

- ใช้ UUID เป็น Internal ID และสร้าง `certificate_code` แยกสำหรับ Public URL
- `users.email`, `silk_items.public_id`, `certificates.certificate_code`, `ledger_blocks.index` และ `ledger_blocks.hash` ต้อง Unique
- ผ้าหนึ่งผืนมี Certificate ได้หนึ่งใบใน MVP; บังคับด้วย Unique Constraint ที่ `certificates.silk_item_id`
- Pending Transfer ต่อ Silk Item มีได้หนึ่งรายการ; ใช้ PostgreSQL Partial Unique Index สำหรับสถานะ `PENDING`
- Mutation สำคัญรับ `idempotency_key` และบังคับ Unique เพื่อป้องกัน Request ซ้ำ
- ก่อน Append Block ใช้ PostgreSQL Transaction-level Advisory Lock เพื่อ Serialize การเขียน Chain แล้วจึงอ่าน Latest Block
- `ledger_blocks` และ `ledger_events` ต้องมี Database Trigger ปฏิเสธ `UPDATE` และ `DELETE` จาก Application Role
- ทุกตาราง Workflow มี `created_at`, `updated_at`; Event/Ledger ใช้ `created_at` แบบไม่แก้ย้อนหลัง
- ทำ Index สำหรับ `certificate_code`, `silk_item.owner_id`, `certification_request.status`, `transfer.recipient_org_id` และ Foreign Keys ที่ใช้ Query บ่อย
- Private Key ของ Validator ห้ามเก็บใน PostgreSQL หรือ Git; เก็บ Server-only ผ่าน Environment/Local Secret Files และใส่เฉพาะ Public Key ใน `ledger_validators`

การ Append Ledger Block และเปลี่ยน Business State ต้องอยู่ใน Prisma Transaction เดียวกัน หาก Hash, Rotation, Nonce หรือ Signature ไม่ผ่าน ให้ Throw Error เพื่อ Rollback ทั้ง Transaction

### 10.7 Ledger Event Catalog

หนึ่ง Block เก็บหนึ่ง Domain Event เพื่อให้สาธิตและตรวจสอบง่าย:

| Event | เกิดเมื่อ | ข้อมูลหลัก |
|---|---|---|
| `GENESIS` | Seed ระบบครั้งแรก | Network ID, Validator Set Hash |
| `ISSUE_CERTIFICATE` | สหกรณ์อนุมัติคำขอ | Certificate ID, Silk Item ID, Revision/Evidence Hash, Issuer ID |
| `TRANSFER_ACCEPTED` | ผู้รับยืนยันการส่งมอบ | Silk Item ID, From/To Organization ID |
| `CERTIFICATE_SUSPENDED` | สหกรณ์ระงับใบรับรอง | Certificate ID, Reason Code |
| `CERTIFICATE_REACTIVATED` | สหกรณ์คืนสถานะ | Certificate ID, Reason Code |
| `CERTIFICATE_REVOKED` | สหกรณ์เพิกถอนถาวร | Certificate ID, Reason Code |

Draft, Submission, Rejection, Pending/Rejected Transfer และการสแกน QR เป็น Workflow/Read Operation ใน PostgreSQL ไม่สร้าง Block เพราะยังไม่เปลี่ยนข้อเท็จจริงที่ต้องรับรองร่วมกัน

## 11. Pseudo-code

### 11.1 ส่งคำขอรับรอง

```text
FUNCTION submitForCertification(actor, silkItemId, revisionId, idempotencyKey):
    REQUIRE actor.role == WEAVER
    REQUIRE actor owns silkItemId
    REQUIRE revision.status == DRAFT
    REQUIRE required fields and evidence are complete
    REQUIRE idempotencyKey has not been processed

    LOCK revision
    SET revision.status = SUBMITTED
    CREATE certification request
    CREATE workflow audit log SUBMISSION_CREATED
    RETURN requestId
```

### 11.2 อนุมัติใบรับรอง

```text
FUNCTION approveCertification(actor, requestId, reviewNote, idempotencyKey):
    REQUIRE actor.role == COOPERATIVE_OFFICER
    REQUIRE request.status == SUBMITTED
    REQUIRE no active certificate exists for silkItemId
    REQUIRE reviewNote and evidence checks are complete

    BEGIN DATABASE TRANSACTION
    LOCK request and latest ledger block
    REQUIRE idempotencyKey has not been processed
    CALCULATE revisionHash
    SELECT expected PoA validator by round-robin
    CREATE and sign ISSUE_CERTIFICATE block
    VERIFY new block hash, nonce, validator, and signature
    CREATE certificate with status ACTIVE and block reference
    MARK request as APPROVED
    COMMIT

    IF any step fails:
        ROLLBACK
        RETURN actionable error

    RETURN verification URL; UI renders QR on demand
    RETURN ACTIVE certificate
```

### 11.3 ปฏิเสธคำขอ

```text
FUNCTION rejectCertification(actor, requestId, reasonCode, reviewNote):
    REQUIRE actor.role == COOPERATIVE_OFFICER
    REQUIRE request.status == SUBMITTED
    REQUIRE reasonCode and reviewNote are present

    SET request.status = REJECTED
    CREATE workflow audit log CERTIFICATION_REJECTED
    RETURN rejection reason for Weaver Dashboard
```

### 11.4 ส่งมอบ

```text
FUNCTION initiateTransfer(actor, silkItemId, recipientOrgId):
    REQUIRE actor is current custodian
    REQUIRE certificate.status == ACTIVE
    REQUIRE recipient organization is authorized
    REQUIRE no pending transfer exists

    CREATE transfer with status PENDING in workflow tables

FUNCTION acceptTransfer(actor, transferId):
    REQUIRE actor belongs to recipient organization
    REQUIRE transfer.status == PENDING
    REQUIRE certificate.status == ACTIVE

    BEGIN DATABASE TRANSACTION
    LOCK transfer, silk item, and latest ledger block
    CREATE and sign TRANSFER_ACCEPTED block
    SET transfer.status = ACCEPTED
    SET current custodian = recipient organization
    COMMIT

    IF any step fails:
        ROLLBACK
```

### 11.5 ระงับหรือเพิกถอน

```text
FUNCTION changeCertificateStatus(actor, certificateId, action, reason):
    REQUIRE actor.role == COOPERATIVE_OFFICER
    REQUIRE reason is present

    IF action == SUSPEND:
        REQUIRE current status == ACTIVE
        target status = SUSPENDED
    ELSE IF action == REACTIVATE:
        REQUIRE current status == SUSPENDED
        target status = ACTIVE
    ELSE IF action == REVOKE:
        REQUIRE current status IN [ACTIVE, SUSPENDED]
        target status = REVOKED
    ELSE:
        REJECT

    BEGIN DATABASE TRANSACTION
    LOCK certificate and latest ledger block
    CREATE and sign CERTIFICATE_STATUS_CHANGED block
    SET certificate.status = target status
    COMMIT

    IF any step fails:
        ROLLBACK
```

### 11.6 ตรวจสอบใบรับรอง

```text
FUNCTION verifyCertificate(certificateId):
    READ certificate from public read model

    IF not found:
        RETURN NOT_FOUND

    VERIFY referenced block hash, previous hash, validator rotation, nonce, and signature

    IF verification fails:
        RETURN CHAIN_INVALID

    RETURN public certificate data, status, issuer, and custody timeline
```

ฟังก์ชันนี้เป็น Read Query ไม่สร้าง Ledger Event

## 12. Public Verification Result

หน้า Verification ต้องแสดงผลแยกกันอย่างชัดเจน:

| Result | ความหมาย | การแสดงผล |
|---|---|---|
| VALID | พบใบรับรองและสถานะ Active | แสดงข้อมูลแหล่งที่มา Issuer และ Timeline |
| SUSPENDED | ใบรับรองหยุดใช้ชั่วคราว | แสดงคำเตือนและเหตุผลสาธารณะที่เหมาะสม |
| REVOKED | ใบรับรองถูกเพิกถอน | แสดงว่าไม่ควรใช้ยืนยันสินค้า |
| NOT_FOUND | ไม่พบ Certificate ID | เตือนว่า QR/รหัสอาจไม่ถูกต้องหรือปลอม |
| CHAIN_INVALID | Hash, Signature หรือ Previous Hash ไม่ถูกต้อง | แสดงคำเตือนว่าตรวจความสมบูรณ์ไม่ได้และห้ามแสดง Valid |

ต้องมีข้อความกำกับว่า Valid Certificate ยืนยัน Digital Record และกระบวนการรับรองที่บันทึกไว้ ไม่ใช่การตรวจคุณภาพทางกายภาพแบบ Real-time

## 13. QR Design

QR ควรบรรจุเพียง URL เช่น:

```text
https://example.org/certificate/{certificateId}
```

ข้อกำหนด:

- ห้ามใส่ PII หรือ Secret ใน QR
- Certificate ID ต้องคาดเดายากพอที่จะไม่ใช้การไล่เลขเพื่อดึงข้อมูลจำนวนมาก
- การเปลี่ยน Domain ต้องมี Redirect Plan
- QR ที่ถูกคัดลอกจะเปิดหน้าเดียวกัน จึงต้องแสดงรูป ลักษณะสินค้า และสถานะเพื่อช่วยเทียบกับของจริง
- Tamper-evident Label หรือ NFC เป็น Future Work ไม่ใช่ความสามารถของ Blockchain โดยตรง

## 14. PDPA, Ethics และ Security

### 14.1 Data Minimization

- หน้า Public แสดงเฉพาะข้อมูลที่จำเป็นต่อการตรวจแหล่งที่มา
- ไม่แสดงที่อยู่ เบอร์โทร เลขประจำตัว หรือเอกสารส่วนตัวของช่างทอ
- เก็บ PII Off-chain และกำหนด Retention Period
- Hash ไม่ถือว่าปลอดจาก PDPA โดยอัตโนมัติ ต้องประเมินว่าสามารถเชื่อมกลับถึงบุคคลได้หรือไม่

### 14.2 Consent และ Legal Basis

- ต้องระบุวัตถุประสงค์การใช้ข้อมูลแยกตาม Workflow
- ไม่ควรสรุปว่าทุกการประมวลผลใช้ Consent จนกว่าจะวิเคราะห์ฐานกฎหมายที่เหมาะสม
- เก็บ Consent/Privacy Notice Version และเวลาให้ความยินยอมไว้ Off-chain เมื่อ Consent เป็นฐานที่ใช้

### 14.3 Right to Correction/Erasure

- ข้อมูล PII ใน PostgreSQL/Local Server Storage ต้องมี Workflow แก้ไขหรือลบ
- Ledger ไม่ลบ Event เดิม แต่สามารถเพิ่ม Correction/Revocation Event ที่ไม่เปิดเผย PII
- การลบไฟล์ Off-chain ทำให้ Hash เดิมเหลือเป็นหลักฐานเชิงโครงสร้าง แต่ต้องตรวจว่า Hash/Metadata ที่เหลือไม่สามารถระบุตัวบุคคลได้

### 14.4 Access Control

- ใช้ Role-based Access Control และตรวจสิทธิ์ที่ Backend ทุกครั้ง
- ห้ามพึ่งการซ่อนปุ่มใน Frontend เป็นการรักษาสิทธิ์
- การอนุมัติ ระงับ และเพิกถอนต้องเก็บ Actor, เวลา และเหตุผล
- บัญชีเจ้าหน้าที่รับรองต้องได้รับการสร้างหรืออนุมัติโดยองค์กร ไม่เปิดสมัครสาธารณะ
- Secret และ Private Key ไม่เก็บใน Browser หรือ Source Code
- Upload อนุญาตเฉพาะ MIME/Extension ที่กำหนด จำกัดขนาด สร้างชื่อไฟล์แบบสุ่ม และป้องกัน Path Traversal
- ไฟล์หลักฐานภายในต้องอ่านผ่าน Authorized Server Route ไม่เปิด `storage/uploads` เป็น Public Static Directory
- QR Camera เรียกใช้เฉพาะฝั่ง Client หลัง Mounted และมีช่องกรอก Certificate Code เป็น Fallback เมื่อกล้องใช้ไม่ได้

## 15. Failure and Edge Cases

| กรณี | พฤติกรรมที่ต้องการ |
|---|---|
| กด Submit/Approve ซ้ำ | Idempotency Key ทำให้เกิดผลเพียงครั้งเดียว |
| Silk Item เดียวถูกอนุมัติพร้อมกัน | Unique Constraint/Lock ป้องกัน Active Certificate ซ้ำ |
| สร้างหรือลงนาม Block ไม่สำเร็จ | Rollback PostgreSQL Transaction และแสดง Error โดยไม่เปลี่ยนข้อมูลธุรกิจ |
| Upload สำเร็จแต่ Submit ล้มเหลว | เก็บเป็น Draft และมี Cleanup Policy สำหรับไฟล์กำพร้า |
| ร้านค้าสองแห่งรับพร้อมกัน | รับได้เฉพาะ Pending Transfer เดียวและตรวจ Version ก่อนเปลี่ยน Custodian |
| Certificate ถูกระงับระหว่าง Transfer | ปฏิเสธ Acceptance และคง Custodian เดิม |
| QR ไม่ครบหรือ Certificate ID ผิด | แสดง Not Found โดยไม่เปิดเผยรายละเอียดภายใน |
| QR ถูกคัดลอกไปติดผ้าอีกผืน | แสดงรูป/ลักษณะสินค้าและคำเตือน; รองรับ Revocation |
| เจ้าหน้าที่ทำบัญชีหายหรือถูกยึด | ระงับบัญชี หมุน Key และ Audit การกระทำย้อนหลัง |
| Hash Chain หรือ Signature ไม่ถูกต้อง | แสดง Chain Invalid, ห้ามทำ Mutation เพิ่ม และแจ้งผู้ดูแล |
| ต้องแก้ข้อมูลหลังออกใบรับรอง | ใช้ Amendment หรือ Revoke/Reissue ไม่เขียนทับประวัติ |

## 16. Nuxt Implementation Strategy

### Phase 1 — Functional Nuxt MVP

- Nuxt Application พร้อม Responsive Web UI
- Nuxt Server Routes สำหรับ API
- PostgreSQL และ Seed Data สำหรับการสาธิต
- Login และ Role-based Access Control สำหรับช่างทอ สหกรณ์ และร้านค้า
- Public Verification ที่ไม่ต้อง Login
- Form Validation และ State Transition ตาม Rules
- File Upload สำหรับรูปและหลักฐาน
- QR Code ที่เปิด Public Certificate Page
- Local Consortium/PoA Simulator ที่สร้าง Block Hash, Previous Hash, Validator Nonce, Ed25519 Signature และ Timeline พร้อม Label ว่า “Simulation”
- Architecture, Flow และ Pseudo-code ตามเอกสารนี้

### Phase 2 — Reliability and Verification

- Local File Storage และ File Hash Verification
- Atomic PostgreSQL Transaction สำหรับ Business Record และ Ledger Block
- Chain Integrity Check ที่ตรวจ Block Hash, Previous Hash, Validator Rotation, Nonce และ Signature
- Automated Tests สำหรับ Permission, State Transition, Idempotency และ Public Verification
- Error Handling สำหรับ Upload, Duplicate Submit และ Concurrent Transfer
- Loading, Empty, Error, Permission และ Responsive States ครบทุกหน้าหลัก
- Demo Data และ Scenario สำหรับการนำเสนอ

### Phase 3 — Future Production Architecture

- ประเมินการเปลี่ยน Local Simulator เป็น Permissioned Consortium Blockchain จริง
- Validator Nodes ตาม Governance ที่ยืนยันแล้ว
- Key Management และ Node Monitoring
- Pilot กับ Stakeholder จริง

## 17. Acceptance Criteria

### Functional

- ช่างทอสร้าง Draft และส่งคำขอได้เมื่อข้อมูลจำเป็นครบ
- ผู้ไม่มี Role สหกรณ์อนุมัติหรือเพิกถอนใบรับรองไม่ได้
- สหกรณ์ปฏิเสธคำขอโดยไม่ใส่เหตุผลไม่ได้
- ผ้าหนึ่งผืนมี Active Certificate ได้ไม่เกินหนึ่งใบ
- QR เปิดหน้าของ Certificate ID ที่ถูกต้อง
- QR และหน้า Public แสดง Valid หลัง Certificate กับ Block ถูก Commit สำเร็จใน Transaction เดียวกันเท่านั้น
- ร้านค้ารับมอบได้เมื่อ Certificate Active และตนเป็นผู้รับที่ระบุ
- ผู้ใช้ Public อ่านข้อมูลได้แต่เปลี่ยน State ไม่ได้
- การระงับ/เพิกถอนปรากฏใน Public Verification หลัง Transaction Commit
- ประวัติที่ยืนยันแล้วไม่ถูกลบหรือเขียนทับ

### Privacy and Security

- หน้า Public ไม่มีที่อยู่ เบอร์โทร หรือข้อมูลระบุตัวบุคคลที่ไม่จำเป็น
- File URL ภายในไม่เปิดแบบ Public โดยตรง
- Backend ตรวจ Role ทุก Write Operation
- Password และ Secret ไม่อยู่ใน Ledger, QR หรือ Client Bundle
- Log การอนุมัติ ปฏิเสธ ระงับ และเพิกถอนมี Actor/เวลา/เหตุผล

### UI, Responsive และ Accessibility

- ทุก Form มี Label, Inline Validation, Loading/Disabled State และรักษาค่าที่กรอกเมื่อ Error
- ทุกหน้าหลักมี Loading, Empty, Error และ Permission-denied State
- Action ที่ย้อนกลับยากใช้ `useConfirm()` และผลลัพธ์ Action ใช้ `useToast()`
- ใช้งาน Flow หลักด้วย Keyboard ได้และ Focus-visible มองเห็นชัด
- Status ใช้ข้อความร่วมกับ Icon/สี และผ่าน Contrast ที่เหมาะสม
- Dashboard ใช้งานได้ทั้ง Desktop และ Mobile-width โดยไม่มี Horizontal Overflow ที่ไม่ตั้งใจ
- Table บนจอแคบเปลี่ยนเป็น Card/List หรือ Scroll เฉพาะกรณีที่ต้องเทียบ Column

### Blueprint Consistency

- Actor, State และ Event ใน Architecture Diagram, Transaction Flow, Block Data และ Pseudo-code ใช้ชื่อชุดเดียวกัน
- Consensus และความเสี่ยงสอดคล้องกับจำนวน Validator และ Trust Model
- แยกข้อเท็จจริงจากเอกสาร สมมติฐาน และ Future Work ชัดเจน
- อธิบายได้ว่า SQL ทำหน้าที่อะไรและ Blockchain เพิ่มคุณค่าอะไร

## 18. Decisions และข้อมูลที่ยังต้องยืนยัน

- [x] ทำเฉพาะ Responsive Web
- [x] ใช้ Nuxt 4 แบบ Full-stack และ pnpm
- [x] ใช้ PostgreSQL
- [x] ใช้ Prisma ORM, Migration และ Seed
- [x] ใช้ `nuxt-auth-utils` สำหรับ Session/Password Hashing
- [x] ใช้ Local Blockchain Simulation สำหรับงานรายวิชา
- [x] เลือก Consortium Blockchain + PoA สำหรับ Blueprint
- [x] ใช้ Validator Roles จำลอง 3 บทบาทและ Round-robin Block Producer
- [x] ใช้ Validator Nonce แบบ Sequence และ Ed25519 Signature
- [x] เก็บไฟล์บน Local Server Storage สำหรับ Demo
- [x] MVP รับรองผ้าไหมรายผืน
- [ ] ยืนยันขั้นตอนตรวจผ้าและหลักฐานที่สหกรณ์ใช้จริง
- [ ] ยืนยันข้อมูลใดแสดงต่อผู้บริโภคได้
- [ ] ยืนยันชื่อองค์กรจริงที่จะใช้อ้างอิงแทน Validator Roles จำลอง
- [ ] กำหนดวิธี Deploy เว็บ Nuxt สำหรับวันนำเสนอ
- [ ] ยืนยันชื่อหัวข้อสุดท้ายกับอาจารย์

รายการที่ยังไม่ยืนยันเป็นข้อมูลโดเมนและการนำเสนอ ไม่ขวางการ Scaffold ระบบหรือพัฒนา Core Workflow ด้วย Seed Data

## 19. Recommended Build Order

1. **Foundation** — Scaffold Nuxt 4, pnpm, Tailwind, Lucide, Prisma, `nuxt-auth-utils` และ Docker Compose PostgreSQL
   - Verify: Dev server เปิดได้, Prisma เชื่อม DB ได้, Migration/Seed สำเร็จ
2. **Shared UI และ Layout** — สร้าง Public Layout, Dashboard Layout, Sidebar/Drawer, Button/Input/Dialog, `useToast()` และ `useConfirm()`
   - Verify: Keyboard/Responsive/Loading/Error states ของ Component หลัก
3. **Authentication และ RBAC** — Login/Logout, Sealed Session, Password Hash, Route Middleware และ Server Permission Helpers
   - Verify: แต่ละ Role เข้าได้เฉพาะ Route/API ของตน; Public Route ไม่ต้อง Login
4. **Silk Item Workflow** — Draft, Revision, Evidence Upload, Submit และ Review Queue
   - Verify: Validation, Ownership, Duplicate Submit และ Reject/Resubmit
5. **Ledger Simulator** — Genesis Block, Validator Seed/Keys, Round-robin PoA, Nonce, SHA-256, Ed25519, Append-only Trigger และ Integrity Check
   - Verify: Valid Chain ผ่าน; แก้ Hash/Signature/Previous Hash ใน Test Fixture แล้วตรวจพบ
6. **Certification** — Approve แบบ Atomic, Certificate Code, QR และ Public Certificate Page
   - Verify: Certificate/Block สำเร็จพร้อมกันหรือ Rollback พร้อมกัน; Public DTO ไม่มี PII
7. **Certificate Status และ Custody** — Suspend/Reactivate/Revoke, Initiate/Accept/Reject Transfer และ Timeline
   - Verify: State/Role/Concurrency Rules และ Rollback เมื่อสร้าง Block ไม่สำเร็จ
8. **Blockchain Explorer** — Block List, Block Detail, Validator/Signature และ Chain Integrity Result พร้อมป้าย Simulation
   - Verify: ไม่เปิด Payload ที่เป็น PII และแสดง Invalid State ชัดเจน
9. **Quality Gate** — Type Check, Lint, Unit/API/E2E Tests, Accessibility, Responsive และ Security Review
   - Verify: คำสั่งตรวจทั้งหมดผ่านและไม่มี Critical Flow ที่ใช้ได้เฉพาะ Happy Path
10. **Demo Readiness** — Seed Scenario, Demo Accounts, QR ตัวอย่าง, Backup/Reset Script และ Presentation Script
   - Verify: Reset แล้วสาธิต Flow ช่างทอ → สหกรณ์ → ร้านค้า → ผู้บริโภคได้ตั้งแต่ต้นจนจบ

## 20. Development Environment Contract

### Environment Variables

ไฟล์ `.env.example` ต้องมีเฉพาะชื่อและค่าตัวอย่าง ห้าม Commit Secret จริง:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5437/buriram_silk
NUXT_SESSION_PASSWORD=replace-with-at-least-32-characters
NUXT_PUBLIC_APP_BASE_URL=http://localhost:3007
UPLOAD_DIR=./storage/uploads
VALIDATOR_KEY_DIR=./storage/validator-keys
```

`storage/uploads/`, `storage/validator-keys/`, `.env`, `.nuxt/` และ `.output/` ต้องอยู่ใน `.gitignore` ยกเว้น `.gitkeep` ที่จำเป็น

### Required Scripts

`package.json` ควรมี Script Contract ต่อไปนี้:

```text
pnpm dev             # เริ่ม Nuxt development server
pnpm build           # production build
pnpm typecheck       # Nuxt/TypeScript type check
pnpm lint            # lint
pnpm test            # unit + integration tests
pnpm test:e2e        # browser flow tests
pnpm db:migrate      # Prisma migration
pnpm db:seed         # seed roles, demo users, validators, genesis block, silk data
pnpm db:reset        # reset local demo database and seed again
pnpm ledger:verify   # verify hash chain, rotation, nonce, and signatures
```

### Local Startup Contract

1. `pnpm install`
2. คัดลอก `.env.example` เป็น `.env` และตั้ง Secret
3. `docker compose up -d` เพื่อเริ่ม PostgreSQL
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm ledger:verify`
7. `pnpm dev`

## 21. Seed Data และ Demo Scenario

Seed ต้องสร้างข้อมูลที่ไม่ใช่บุคคลจริง:

- บัญชี `WEAVER`, `COOPERATIVE_OFFICER`, `STORE_USER`
- Organization จำลองสำหรับสหกรณ์ ร้านค้า และ Validator Roles
- Validator 3 ราย พร้อม Public Key, Nonce เริ่มต้น และ Genesis Block
- Silk Item อย่างน้อย 4 สถานะ: Draft, Submitted, Active Certificate และ Revoked Certificate
- Pending Transfer หนึ่งรายการและ Accepted Transfer หนึ่งรายการ
- QR/Certificate Code ที่ใช้สาธิต Public Verification

Demo Flow หลัก:

1. Login เป็นช่างทอและสร้าง/ส่งรายการใหม่
2. Login เป็นสหกรณ์ ตรวจและอนุมัติ
3. เปิด Blockchain Explorer เพื่อดู Block/Signature
4. สแกน QR และตรวจใบรับรองแบบ Public
5. ส่งมอบให้ร้านค้าและยืนยันรับ
6. ระงับหรือเพิกถอนใบรับรองด้วย Confirm Dialog
7. ตรวจว่า Timeline และ Chain Integrity เปลี่ยนตาม Event

## 22. Definition of Done

ระบบพร้อมนำเสนอเมื่อ:

- Core Flow ทุก Role ทำงานกับ PostgreSQL จริง ไม่ใช่ Hard-coded UI State
- Mutation สำคัญสร้าง Business Record และ Ledger Block แบบ Atomic
- Ledger Verify ตรวจ Hash, Previous Hash, Nonce, Round-robin Validator และ Ed25519 Signature
- Public Certificate และ Explorer ไม่เปิดเผย PII หรือ Server Secret
- RBAC และ State Validation ถูกตรวจฝั่ง Server ทุก Endpoint
- Duplicate Submit และ Concurrent Approval/Transfer ถูกป้องกันด้วย Constraint/Lock
- Loading, Empty, Error, Permission, Keyboard และ Responsive States ผ่านการตรวจ
- `build`, `typecheck`, `lint`, `test`, `test:e2e` และ `ledger:verify` ผ่าน
- Reset/Seed แล้วสาธิต Flow หลักได้โดยไม่แก้ข้อมูลด้วยมือ
- หน้าเว็บและรายงานระบุชัดว่า Blockchain/PoA เป็น Local Simulation
