# แผนปรับระบบเป็น Cooperative-operated Workflow

เอกสารนี้เป็นทั้งแผนสถาปัตยกรรม รายการตรวจผลกระทบ และคำมอบหมายสำหรับ AI agent ที่จะปรับระบบจากบัญชีผู้ใช้ 3 บทบาท ให้เหลือเฉพาะเจ้าหน้าที่สหกรณ์เป็นผู้ใช้หลังบ้าน ช่างทอและร้านค้ายังคงเป็นข้อมูลธุรกิจ ส่วนผู้บริโภคใช้หน้าตรวจสอบสาธารณะเหมือนเดิม

## 1. Contract สำหรับ AI agent

- **Consumer:** AI coding agent ที่ได้รับมอบหมายให้แก้ repository นี้
- **Trigger:** ใช้เมื่อผู้ใช้อนุมัติให้เริ่ม migration ตามเอกสารฉบับนี้
- **Outcome:** มีเพียงเจ้าหน้าที่สหกรณ์ที่เข้าสู่ระบบและทำ workflow หลังบ้านได้ ตั้งแต่ลงทะเบียนช่างทอ/ร้านค้า ลงทะเบียนผ้า ตรวจรับรอง บันทึกส่งมอบ และจัดการใบรับรอง ขณะที่ public verification ยังทำงานเดิม
- **Authority:** แก้ source code, schema, migration, seed, tests และเอกสารภายใน repository ตามขอบเขตนี้ได้ แต่ห้ามแตะ `.env`, `storage/`, private keys หรือ `app/generated/`; ห้าม commit, push, deploy, reset database จริง หรือแก้ git history หากผู้ใช้ไม่ได้สั่ง
- **Source of truth หลังจบงาน:** ต้องปรับ `docs/system-design.md` และ `docs/database-design.md` ให้ตรงกับ behavior ที่ implement จริง ห้ามปล่อยให้เอกสารยังอธิบายระบบ 3 roles

ก่อนลงมือ agent ต้องอ่าน `AGENTS.md` และโหลด skills ต่อไปนี้:

1. `web-ui-coding-standards` ก่อนสร้างหรือแก้โค้ด
2. `testing-standards` ก่อนออกแบบหรือแก้ tests
3. `diagnosing-bugs` หาก baseline หรือ quality gate ล้มเหลวโดยไม่ทราบสาเหตุ
4. `scrutinize` เพื่อตรวจ final diff แบบ end-to-end ก่อนส่งมอบ

## 2. เป้าหมายและขอบเขตที่ตกลงใช้ในแผน

### เป้าหมาย

ลดความซับซ้อนในการใช้งานภาคสนาม โดยให้สหกรณ์เป็นจุดบริการกลาง:

1. ช่างทอมาที่สหกรณ์ เจ้าหน้าที่ลงทะเบียนบุคคลและผ้าไหมให้
2. เจ้าหน้าที่ส่งรายการเข้าสู่คิวตรวจ และเจ้าหน้าที่ผู้มีสิทธิ์ตรวจอนุมัติหรือปฏิเสธ
3. ร้านค้ามาที่สหกรณ์ เจ้าหน้าที่ลงทะเบียนร้านค้าและบันทึกการรับมอบ
4. ลูกค้าสแกน QR หรือกรอก Certificate ID เพื่อตรวจสอบได้โดยไม่ต้อง login

### หลักการออกแบบ

- `User` หมายถึงบัญชีเจ้าหน้าที่สหกรณ์เท่านั้น
- ช่างทอเป็น entity ทางธุรกิจและข้อมูลส่วนบุคคล ไม่ใช่บัญชี login
- ร้านค้าเป็น `Organization` ประเภท `STORE` ไม่ใช่บัญชี login
- เก็บผู้กระทำทุก workflow เป็นเจ้าหน้าที่ เพื่อให้ audit ได้ว่าใครบันทึกหรืออนุมัติรายการ
- เก็บช่างทอและร้านค้าเป็นคู่กรณีของเหตุการณ์ ไม่ปลอมให้เป็น actor ที่ login
- Public API ต้องเปิดเผยเฉพาะชื่อแสดงผลของช่างทอและข้อมูลที่อนุญาต ไม่คืนเบอร์โทร ที่อยู่ หรือข้อมูลภายใน
- คง Local Blockchain Simulation สำหรับ requirement การสาธิต แต่บันทึกข้อจำกัดให้ชัดว่า authority ทางธุรกิจหลักเหลือองค์กรเดียว

### นอกขอบเขต

- self-service portal หรือบัญชี login สำหรับช่างทอและร้านค้า
- ระบบจองคิวที่สหกรณ์ ลายเซ็นอิเล็กทรอนิกส์ OTP หรือ e-KYC
- ระบบขายสินค้า ชำระเงิน สต็อก หรือบัญชีร้านค้า
- การเชื่อม blockchain network จริง
- การออกแบบ multi-cooperative tenancy ใหม่ทั้งหมด

## 3. ข้อเท็จจริงที่ตรวจพบจากโค้ดปัจจุบัน

- `prisma/schema.prisma` กำหนด `UserRole` เป็น `WEAVER`, `COOPERATIVE_OFFICER`, `STORE_USER`
- `WeaverProfile` ผูกแบบ one-to-one กับ `User`; `SilkItem.ownerUserId` ชี้ไปยังบัญชีช่างทอ
- `CertificationRequest.submittedByUserId` ใช้บัญชีช่างทอ ส่วน reviewer เป็นเจ้าหน้าที่
- `CustodyTransfer.resolvedByUserId` ปัจจุบันใช้บัญชีขององค์กรผู้รับ และ endpoint accept ตรวจว่า session อยู่ใน `toOrgId`
- หน้า `/weaver/**`, navigation, middleware, demo login, shared API types และ tests ผูกกับ role ช่างทอ
- หน้า `/transfers` และ endpoints ใช้ session ของหลาย role และ ownership ระดับองค์กร
- public certificate API อ่านชื่อผู้ทอผ่าน `SilkItem.ownerUser.displayName`
- seed มี demo account ครบสาม role และใช้บัญชีเหล่านั้นสร้างข้อมูลตัวอย่าง
- ledger event เก็บ `actorId` เป็น user ผู้ทำรายการ จึงสามารถคงเป็นเจ้าหน้าที่ได้โดยไม่ต้องสร้างบัญชีช่างทอหรือร้านค้า
- migration ปัจจุบันสร้าง enum และ foreign keys ตามโมเดล 3 roles; การเปลี่ยน schema ต้องทำผ่าน migration ใหม่ ห้ามแก้ migration เดิม

## 4. สมมติฐานที่แผนนี้เลือกใช้

สมมติฐานเหล่านี้ยังไม่ใช่ข้อเท็จจริงจากระบบงานจริง หาก stakeholder ไม่เห็นด้วย ให้หยุดเฉพาะส่วนที่ได้รับผลและขอคำตอบก่อนสร้าง migration:

1. ระบบ MVP มีสหกรณ์ผู้ดำเนินงานหนึ่งแห่ง แต่ยังเก็บ `Organization` เพื่อรองรับร้านค้าหลายแห่งและประวัติ custody
2. ช่างทอไม่ต้องมี email หรือ password; ชื่อเต็มเป็นข้อมูลบังคับ เบอร์โทรและที่อยู่เป็นข้อมูลจำกัดสิทธิ์
3. เจ้าหน้าที่สามารถลงทะเบียนและส่งคำขอแทนช่างทอได้ แต่ผู้สร้าง/ผู้ส่งและผู้ตรวจต้องถูกเก็บแยกกันใน audit
4. ค่าเริ่มต้นควรห้ามเจ้าหน้าที่คนเดียวกันอนุมัติคำขอที่ตนส่ง เพื่อรักษา separation of duties หากต้องการ demo แบบคนเดียว ให้ใช้ policy/config ที่ตั้งใจและมีข้อความเตือน ห้ามหลบด้วยการไม่ตรวจ
5. ร้านค้ามารับสินค้าที่สหกรณ์ การรับมอบจึงบันทึกโดยเจ้าหน้าที่พร้อมชื่อผู้รับ/หลักฐาน ไม่ต้อง login เป็นร้านค้า
6. เพื่อรักษาประวัติและลดการรื้อ state model ให้คง `PENDING → ACCEPTED/REJECTED/CANCELLED` ไว้ใน phase แรก แม้ทั้งสอง action จะทำโดยเจ้าหน้าที่; UI ต้องทำให้เป็นขั้นตอน “เตรียมส่งมอบ” และ “ยืนยันผลการรับมอบ” ที่เข้าใจได้
7. custody เริ่มต้นอยู่กับสหกรณ์ และเมื่อรับมอบสำเร็จจึงเปลี่ยนเป็นองค์กรร้านค้า

## 5. Scrutiny: ทางเลือกที่เล็กกว่าและคำตัดสิน

### ทางเลือกที่เล็กที่สุดแต่ไม่เพียงพอ

ซ่อน demo login ของช่างทอ/ร้านค้า แล้วให้เจ้าหน้าที่ impersonate role เดิม จะเปลี่ยนเพียงหน้าตา แต่ยังสร้างบัญชีปลอม เก็บ ownership ผิดความหมาย และทำ audit ว่าช่างทอหรือร้านค้าเป็นผู้กดเอง จึงไม่บรรลุเป้าหมาย

### ทางเลือกที่แนะนำ

แยก identity ออกจาก domain ให้ชัด: `User` สำหรับเจ้าหน้าที่, `Weaver` สำหรับช่างทอ, `Organization(STORE)` สำหรับร้านค้า แล้ว reuse revision, certification, certificate, transfer, audit และ ledger state machine ที่มีอยู่ การเปลี่ยนนี้เล็กกว่าการเขียน workflow ใหม่ และไม่บิดความหมายของข้อมูล

### ประเด็นเชิงโครงสร้าง

เมื่อมีสหกรณ์เดียวเป็นผู้เขียนข้อมูล คุณค่าของ Consortium/PoA ลดลง ควรเก็บ simulator เพราะเป็นขอบเขตโครงงานเดิม แต่แก้เอกสารให้ระบุว่าเป็น tamper-evident local audit demonstration ไม่ใช่ trustless multi-organization network

**คำตัดสิน:** rework ก่อนใช้งานจริง เพราะการเปลี่ยนเฉพาะ UI จะทำให้ authorization, ownership และ audit semantics ผิด ต้อง migrate domain model และ endpoint contracts พร้อมกัน

## 6. Target data model

ให้ agent ยืนยันชื่อ field กับ conventions ใน schema ก่อนใช้ โดยเป้าหมายเชิงความหมายเป็นดังนี้:

### `User`

- role เหลือ `COOPERATIVE_OFFICER` หรือถ้า Prisma/PostgreSQL migration ของ enum เสี่ยงเกินประโยชน์ ให้คง enum ชั่วคราวแต่ห้ามสร้าง/รับ session ของ role อื่น และบันทึก debt ชัดเจน
- ต้องสังกัด `Organization` ประเภท `COOPERATIVE`
- คง relations สำหรับ created/submitted/reviewed/uploaded/initiated/resolved/audit actor
- ลบ relation `weaverProfile` และ `ownedSilkItems`

### `WeaverProfile` หรือ rename เป็น `Weaver`

- มี primary key ของตนเอง ไม่ผูก `userId`
- เก็บ `fullName`, `phone`, `address`, timestamps
- เพิ่ม public-safe display field เฉพาะเมื่อชื่อเต็มไม่ควรถูกเปิดเผย; ถ้าไม่เพิ่ม ให้กำหนด masking policy ใน public mapper
- ควรมี `registeredByUserId` และอาจมี `organizationId` หากทะเบียนเป็นของสหกรณ์
- ห้ามเพิ่ม email/password โดยไม่มี requirement

### `SilkItem`

- เปลี่ยน `ownerUserId` เป็น `weaverId`
- relation ชี้ไปยังทะเบียนช่างทอ
- `custodianOrgId` เริ่มเป็นสหกรณ์และยังคงใช้ติดตามร้านค้าปลายทาง
- ผู้สร้างรายการอ้างผ่าน audit log; เพิ่ม `createdByUserId` เฉพาะเมื่อ query/report ต้องใช้บ่อยและ audit log ไม่เพียงพอ

### `CertificationRequest`

- rename ความหมาย `submittedByUserId` ให้เป็นเจ้าหน้าที่ผู้ส่ง เช่น `submittedByOfficerId` หรือคงชื่อทางเทคนิคเดิมหาก migration cost ไม่คุ้ม แต่ API/docs ต้องไม่เรียกบุคคลนี้ว่าช่างทอ
- `reviewedByUserId` ยังคงเป็นเจ้าหน้าที่
- enforce separation of duties ใน service/API และทดสอบกรณีผู้ส่งพยายามอนุมัติเอง

### `CustodyTransfer`

- `fromOrgId` และ `toOrgId` ยังคงเดิม
- `initiatedByUserId` และ `resolvedByUserId` เป็นเจ้าหน้าที่ผู้บันทึก ไม่ใช่สมาชิกขององค์กรคู่กรณี
- เพิ่มข้อมูลยืนยันผู้มารับแบบ business data เช่น `recipientName`, `recipientContact` (ถ้าจำเป็น), `handoverNote` และ `evidenceId`/ไฟล์หลักฐานตามข้อกำหนดจริง
- ห้ามบันทึก PII ของผู้มารับใน ledger payload; ledger ใช้ organization IDs/names และ transfer ID เท่าที่จำเป็น

### Migration safety

1. สร้างตาราง/คอลัมน์ใหม่และ backfill ก่อนลบ foreign key เดิม
2. แปลง `WeaverProfile` เดิมเป็น entity อิสระ และ map `SilkItem.ownerUserId` ไป `weaverId`
3. map request submitter เดิมให้เจ้าหน้าที่สหกรณ์ของ organization เดียวกัน; หากเลือกไม่ได้อย่าง deterministic ให้ migration หยุดพร้อมรายงาน ห้ามเดาสุ่ม
4. transfer เก่าที่ resolved โดย store user ต้องรักษาข้อมูล historical actor หรือสร้าง explicit legacy attribution; ห้ามเปลี่ยนผู้กระทำย้อนหลังเป็นเจ้าหน้าที่ที่ไม่ได้ทำจริง
5. ทดสอบ migration กับฐานข้อมูลสำเนาหรือฐาน test ก่อน ห้าม reset ฐานผู้ใช้โดยไม่ได้รับคำสั่ง
6. สร้าง migration ใหม่ด้วยชื่อสื่อความหมาย เช่น `cooperative_operated_workflow`; ห้ามแก้ไฟล์ migration เดิม

## 7. Target information architecture

เสนอให้ย้าย route จากชื่อ actor เป็นชื่อ capability:

| Route เป้าหมาย | หน้าที่ |
|---|---|
| `/dashboard` | ภาพรวมงานสหกรณ์และสถานะผ้า |
| `/weavers` | ค้นหาและลงทะเบียนช่างทอ |
| `/weavers/new` | ฟอร์มทะเบียนช่างทอพร้อม consent notice |
| `/silk-items` | รายการผ้าไหมทั้งหมดของสหกรณ์ |
| `/silk-items/new` | เลือก/สร้างช่างทอ แล้วลงทะเบียนผ้า |
| `/silk-items/:id` | รายละเอียด revision, evidence, review และ timeline |
| `/silk-items/:id/edit` | แก้ข้อมูลเฉพาะ revision ที่เป็น `DRAFT` |
| `/review` และ `/review/:id` | คิวตรวจและตัดสินผล |
| `/stores` | ค้นหาและลงทะเบียนร้านค้า |
| `/transfers` และ `/transfers/:id` | เตรียมและยืนยันผลส่งมอบ |
| `/certificates/:id/manage` | จัดการสถานะใบรับรอง |
| public routes เดิม | หน้าแรก, verify, certificate, ledger, about, privacy |

เพื่อรักษา bookmark และลด regression ให้ redirect `/weaver` และ `/weaver/items/**` ไป route ใหม่ที่เทียบเท่าอย่างน้อยหนึ่ง release ห้ามคงหน้าซ้ำสองชุดที่มี logic แยกกัน

Dashboard navigation ต้องมีชุดเดียวสำหรับเจ้าหน้าที่: ภาพรวม, ช่างทอ, ผ้าไหม, คิวตรวจ, ร้านค้า, ส่งมอบ เมนูต้องชี้เฉพาะหน้าที่มีจริง

## 8. Target API และ authorization

### Authentication

- login/session/logout เหลือบัญชีเจ้าหน้าที่
- server ต้องปฏิเสธ inactive user, user ที่ไม่ใช่ officer และ officer ที่ไม่มี cooperative organization
- client redirect หลัง login ไป `/dashboard`
- ลบ role switcher และ demo credentials ของช่างทอ/ร้านค้า
- อย่าพึ่ง client middleware อย่างเดียว ทุก mutation ต้องตรวจ session/role ฝั่ง server

### Weaver registry

- เพิ่ม `GET /api/weavers` สำหรับค้นหา/เลือกช่างทอ โดยคืน PII ตามสิทธิ์เจ้าหน้าที่เท่านั้น
- เพิ่ม `POST /api/weavers` สำหรับลงทะเบียนพร้อม zod validation, normalization และ duplicate strategy
- หากมี detail/update ต้องกำหนด audit action และสิทธิ์ให้ชัดก่อนเพิ่ม

### Silk items

- `POST /api/silk-items` รับ `weaverId` และข้อมูล revision; actor คือ officer
- list/detail มองเห็นได้โดย officer ของสหกรณ์ตาม tenancy policy
- patch/evidence/revision/submit เปลี่ยนจาก `requireOwnership` เป็น officer authorization + organization scope
- response แยก `weaver` ออกจาก `submittedByOfficer`; ห้ามใช้ field `submittedBy` แบบกำกวม
- transaction และ state guards เดิม (`DRAFT`, `SUBMITTED`, revision rules) ต้องคงอยู่

### Review

- คิวแสดงชื่อช่างทอและชื่อเจ้าหน้าที่ผู้ส่งแยกกัน
- approve/reject ตรวจ organization scope และ separation of duties
- approve ยังต้องสร้าง certificate, ledger event และ audit log ใน transaction เดียว

### Stores and transfer

- เพิ่มหรือขยาย organizations API ให้ officer สร้างและค้นหาเฉพาะ `STORE`
- create transfer ตรวจว่า current custodian คือ cooperative ของ officer, certificate เป็น `ACTIVE`, target เป็น `STORE` และไม่มี pending transfer
- accept/reject เปลี่ยนจาก “session ต้องอยู่ในองค์กรปลายทาง” เป็น “officer ของ cooperative ผู้ดูแล workflow บันทึกผลให้ร้านปลายทางที่ระบุ”
- accept ต้องเปลี่ยน custodian เป็นร้าน, สร้าง ledger event และ audit log แบบ atomic
- หลังผ้าอยู่กับร้าน ต้องระบุ policy ชัดว่าใครเริ่ม transfer รอบถัดไป; สำหรับ MVP นี้ไม่รองรับร้านส่งต่อเอง ให้ UI/API ปฏิเสธพร้อมข้อความชัดเจน

### Public verification

- เปลี่ยน query จาก `ownerUser` เป็น `weaver`
- whitelist response fields และมี test ยืนยันว่า phone/address/internal notes ไม่รั่ว
- สถานะใบรับรอง, timeline, issuer, custody และ chain verification ต้องยังทำงาน

## 9. ลำดับการลงมือ

แต่ละ phase ต้องผ่าน checks ของตนก่อนเริ่ม phase ถัดไป เพื่อลดช่วงที่ schema กับ code ไม่ตรงกัน

### Phase 0 — Baseline และ decision checkpoint

1. อ่าน `AGENTS.md`, source-of-truth docs และตรวจ `git status`
2. บันทึกไฟล์ที่มีการแก้เดิม ห้าม overwrite หรือรวม unrelated changes
3. รัน baseline `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`
4. บันทึก failure เดิมแยกจาก regression ใหม่
5. ยืนยันสมมติฐานข้อ 4–7 กับผู้ใช้หากยังไม่ได้รับการอนุมัติ

**เสร็จเมื่อ:** มี baseline ที่ reproducible และไม่มี decision สำคัญที่ agent ต้องเดาเอง

### Phase 1 — Tests สำหรับ behavior เป้าหมาย

เขียนหรือปรับ tests ให้ fail ด้วยเหตุผลที่ถูกต้องสำหรับ:

- officer login และ route access
- non-officer session ถูกปฏิเสธ
- ลงทะเบียนช่างทอและร้านค้า
- officer สร้าง draft ให้ช่างทอ
- PII ไม่ออก public API
- submit/review พร้อม separation of duties
- transfer ที่เจ้าหน้าที่บันทึกแทนร้าน
- public QR/certificate flow เดิม

**เสร็จเมื่อ:** tests แสดงช่องว่างของ behavior ใหม่ โดยไม่ลบ coverage ของ state guards, privacy และ transaction semantics

### Phase 2 — Schema และ migration

1. เพิ่ม independent weaver entity และ officer attribution ที่จำเป็น
2. ทำ expand/backfill/contract migration ตามหัวข้อ 6
3. ปรับ seed ให้มี officer อย่างน้อยสองคน ช่างทอเป็น registry records และร้านค้าไม่มี user
4. รัน Prisma validate/generate ตามคำสั่งของโปรเจกต์ โดยห้ามแก้ `app/generated/` ด้วยมือ

**เสร็จเมื่อ:** migration ใช้ได้ทั้งฐานว่างและ fixture ที่จำลองข้อมูล schema เดิม และข้อมูล historical ไม่ถูกปลอม

### Phase 3 — Server API

1. ทำ authorization helper สำหรับ cooperative officer และ organization scoping
2. ทำ weaver/store registry APIs
3. ปรับ silk item, evidence, revision, submit และ review APIs
4. ปรับ transfer APIs และ ledger/audit payload
5. ปรับ public certificate mapper

**เสร็จเมื่อ:** integration tests ครอบคลุม happy path, forbidden access, invalid states, duplicate/pending constraints, atomic failure และ PII leakage

### Phase 4 — Nuxt UI

1. ปรับ login, session home, middleware, sidebar และ user menu
2. สร้าง dashboard และ registry screens ตาม route เป้าหมาย
3. ย้าย/reuse ฟอร์มและรายละเอียดจาก `/weaver/**`; อย่าคัดลอก business logic เป็นสองชุด
4. ปรับ review ให้แยกช่างทอกับเจ้าหน้าที่ผู้ส่ง
5. ปรับ transfer copy และ confirmation ให้สื่อว่าเจ้าหน้าที่กำลังบันทึกเหตุการณ์ที่เกิด ณ สหกรณ์
6. ใส่ Loading/Empty/Error/Permission state, accessible labels, toast และ confirm ตาม conventions
7. เพิ่ม redirects จาก routes เก่า

**เสร็จเมื่อ:** officer ทำ full workflow ได้จาก navigation โดยไม่ต้องเปลี่ยน role และไม่มี dead route/menu

### Phase 5 — เอกสารและ cleanup

1. ปรับ `docs/system-design.md`, `docs/database-design.md`, README และ teamwork contracts ที่ยังอธิบาย 3 roles
2. ลบ `useDemoRole`, role switcher และ code path ของ weaver/store session เมื่อไม่มี call site แล้ว
3. ค้นหาคำและ identifiers เก่า เช่น `WEAVER`, `STORE_USER`, `ownerUserId`, `requireOwnership`, `/weaver` แล้วจำแนกทุก hit ว่าต้อง migrate, เป็น legacy migration หรือเป็น redirect ที่ตั้งใจ
4. อธิบายข้อจำกัด blockchain single-authority อย่างตรงไปตรงมา

**เสร็จเมื่อ:** code, schema, tests และ docs ใช้ศัพท์เดียวกัน และไม่มี dead authorization branch ที่ทำให้เข้าใจว่าช่างทอ/ร้านค้ายัง login ได้

### Phase 6 — End-to-end scrutiny

Trace อย่างน้อยสอง flow ผ่าน code จริง:

1. Officer A login → register weaver → create silk item/evidence → submit → Officer B approve → public verify
2. Officer สร้าง store → initiate transfer → record acceptance → custodian เปลี่ยน → public timeline แสดง transfer

สำหรับแต่ละ flow ตรวจ entry point → API → authorization → validation → transaction → database state → ledger/audit side effects → UI response ห้ามตรวจเฉพาะ diff

## 10. Acceptance criteria

### Identity และ authorization

- มีเฉพาะ cooperative officer ที่ login หลังบ้านได้
- ไม่มี demo login, role switch หรือ protected route สำหรับช่างทอ/ร้านค้า
- API mutation ทุกตัวตรวจ officer และ organization scope ฝั่ง server
- ผู้ส่งคำขออนุมัติคำขอของตนเองไม่ได้ตาม policy ที่เลือก

### Domain workflow

- ช่างทอและร้านค้าลงทะเบียนได้โดยไม่สร้างบัญชี user
- officer สร้าง แก้ แนบหลักฐาน และส่งรายการแทนช่างทอได้
- review, rejection/new revision, certificate status และ state guards เดิมยังทำงาน
- transfer บันทึกผู้กระทำจริงเป็น officer และคู่กรณีเป็น organization/store
- accepted transfer เปลี่ยน custodian เพียงครั้งเดียวและ atomic กับ ledger/audit

### Privacy และ audit

- public response ไม่มี phone, address, password hash, internal evidence path หรือ review note
- ทุก mutation สำคัญระบุ officer ผู้ทำ เวลา และ business subject ที่เกี่ยวข้อง
- legacy history ไม่ถูกเปลี่ยน attribution อย่างไม่มีหลักฐาน

### UX

- UI และข้อความต่อผู้ใช้เป็นภาษาไทย
- navigation หลังบ้านเป็น capability-based ไม่ใช่ role-based
- ทุกหน้า dashboard มี loading, empty, error และ permission state ที่เหมาะสม
- mobile และ keyboard flow ใช้งานได้ ไม่มี browser `alert()`/`confirm()`

### Verification

- `pnpm typecheck` ผ่าน
- `pnpm lint` ผ่านโดยไม่มี error ใหม่
- `pnpm test` ผ่าน
- `pnpm test:e2e` ผ่าน
- `git diff --check` ผ่าน
- final diff ไม่มี `.env`, `storage/`, private key, `app/generated/`, generated artifacts หรือ unrelated refactor

## 11. Edge cases ที่ต้องทดสอบ

- ช่างทอชื่อซ้ำกัน: ห้าม deduplicate จากชื่ออย่างเดียว
- officer เลือกช่างทอหรือร้านค้าจากสหกรณ์/ขอบเขตที่ไม่มีสิทธิ์
- submit draft ที่ข้อมูลหรือหลักฐานไม่ครบ
- double submit, double approve และ concurrent pending transfer
- officer คนเดียวกันพยายาม submit และ approve
- ใบรับรองถูก suspend/revoke ระหว่าง pending transfer
- ร้านปลายทางไม่ตรงกับ transfer หรือถูกปิดใช้งาน
- accept สำเร็จแต่ ledger append ล้ม: transaction ต้อง rollback ทั้งหมด
- upload สำเร็จบางส่วนแล้ว database ล้ม: ต้องมี cleanup strategy โดยไม่ลบไฟล์นอก scope
- public certificate ของข้อมูล legacy ที่ยัง map ช่างทอไม่ได้
- Unicode/spacing ของชื่อไทย, เบอร์โทรว่าง และข้อมูลยาวเกินกำหนด

## 12. จุดหยุดที่ต้องถามผู้ใช้

หยุดก่อน migration หากข้อใดข้อหนึ่งยังไม่ชัด:

1. อนุญาตให้เจ้าหน้าที่คนเดียวสร้าง/ส่ง/อนุมัติได้หรือไม่
2. ต้องเก็บหลักฐานการมารับของร้านในรูปแบบใด และข้อมูลผู้รับใดเป็นข้อมูลบังคับ
3. หลังร้านรับผ้าแล้ว ระบบต้องรองรับการส่งคืนหรือส่งต่อหรือไม่
4. มีข้อมูล production เดิมที่ต้อง migrate หรือฐานข้อมูลนี้เป็น demo ที่ reset ได้
5. ชื่อเต็มของช่างทอเปิดเผยต่อสาธารณะได้หรือควรใช้ชื่อแสดงผล/การปกปิด

หากไม่มีคำตอบ ให้ implement เฉพาะส่วน reversible ที่ไม่ล็อก schema และรายงาน blocker ห้ามเลือกนโยบายข้อมูลส่วนบุคคลหรือแก้ attribution ย้อนหลังเอง

## 13. รูปแบบรายงานเมื่อ agent ส่งมอบ

รายงานต้องประกอบด้วย:

- behavior ที่เปลี่ยน แยก schema, API, UI, auth และ public flow
- migration strategy และผลทดสอบกับฐานว่าง/fixture เดิม
- project-local conventions หรือการเปลี่ยนเดิมที่รักษาไว้
- คำสั่ง validation ที่รันจริงและผลลัพธ์
- baseline failure ที่มีอยู่ก่อน เทียบกับ regression หลังแก้
- unresolved decisions, limitations และ follow-up ที่อยู่นอกขอบเขต
- รายการไฟล์สำคัญที่แก้

ห้ามกล่าวว่างานเสร็จหรือ tests ผ่าน หากยังไม่ได้รัน full gate และห้าม commit เว้นแต่ผู้ใช้สั่งโดยตรง
