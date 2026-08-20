โปรดตรวจสอบ Project Setup ของ repository นี้ทั้งหมด แล้วแก้ไขสิ่งที่จำเป็นให้พร้อมสำหรับเริ่มพัฒนา โดยยึด `system-design.md` เป็น Source of Truth หลัก

เป้าหมายของงานนี้คือ:

**Audit → Fix → Verify**

ให้ตรวจสอบสถานะปัจจุบันก่อน จากนั้นแก้ไข configuration, dependency, project structure และ development environment ที่ผิด ขาด หรือไม่สอดคล้องกับ System Design แล้วรัน verification จน project foundation อยู่ในสถานะพร้อมพัฒนา

## Project Context

ระบบ:
**ระบบตรวจสอบและรับรองแหล่งที่มาของผ้าไหมทอมือบุรีรัมย์ด้วยเทคโนโลยีบล็อกเชน**

Architecture ที่ล็อกไว้:

* Nuxt 4 Full-stack
* TypeScript
* pnpm
* PostgreSQL
* Docker Compose สำหรับ Local Database
* Prisma ORM
* `nuxt-auth-utils`
* Tailwind CSS
* Lucide Icons
* QR Code
* Local Blockchain Simulation
* SHA-256
* Ed25519
* Consortium Blockchain Blueprint
* Proof of Authority Simulation
* Vitest / Integration Tests / Playwright E2E

ห้ามเปลี่ยน Technology Stack หลักโดยไม่มีเหตุผลด้าน compatibility ที่ชัดเจน

---

# 1. ตรวจสอบ Runtime และ Package Manager

ตรวจสอบ:

* Node.js version
* pnpm version
* Corepack
* `package.json`
* `pnpm-lock.yaml`
* `packageManager` field
* npm/yarn lockfile ที่ไม่ควรมี

ตรวจปัญหาเกี่ยวกับ pnpm build scripts ด้วย โดยเฉพาะ:

```text
ERR_PNPM_IGNORED_BUILDS
esbuild
pnpm approve-builds
```

หาก build dependency ที่ Nuxt จำเป็นต้องใช้ถูก block ให้แก้ configuration ให้ถูกต้องและปลอดภัย

ห้าม whitelist package ที่ไม่จำเป็นโดยไม่มีเหตุผล

---

# 2. ตรวจและแก้ Nuxt Setup

ตรวจ:

* Nuxt 4
* Vue
* Vue Router
* TypeScript
* `nuxt.config.ts`
* modules
* directory structure
* `nuxt prepare`

แก้ configuration ที่ผิดหรือขาด

หลังแก้ต้องให้คำสั่งต่อไปนี้ทำงานได้:

```bash
pnpm dev
pnpm build
pnpm typecheck
```

ห้าม downgrade Nuxt เว้นแต่มี compatibility issue ที่พิสูจน์ได้จริง

---

# 3. Dependencies

เปรียบเทียบ dependencies ปัจจุบันกับ `system-design.md`

Core dependency ที่ระบบควรมีเมื่อจำเป็น:

* `nuxt`
* `vue`
* `vue-router`
* `@prisma/client`
* `nuxt-auth-utils`
* `lucide-vue-next`
* QR library
* validation library เช่น Zod หาก architecture ใช้งานจริง

Development tooling:

* `prisma`
* Tailwind integration
* ESLint
* Vitest
* Vue Test Utils
* test DOM environment
* Playwright

ดำเนินการดังนี้:

* ติดตั้ง dependency ที่จำเป็นแต่ยังขาด
* ลบ dependency ที่เกิดจาก setup ผิดหรือซ้ำซ้อน หากมั่นใจว่าไม่มีการใช้งาน
* แก้ incompatible versions
* ห้าม upgrade package เพียงเพราะมี version ใหม่กว่า
* หลีกเลี่ยง dependency ที่ architecture ไม่ต้องการ

ห้ามเพิ่ม:

* Express
* NestJS
* Axios หาก `$fetch` เพียงพอ
* Web3
* ethers
* Hardhat
* Solidity tooling
* Hyperledger
* Redis
* RabbitMQ
* Pinia

เว้นแต่พบ code ที่ใช้งานจริงและมีเหตุผลชัดเจน

---

# 4. Tailwind CSS

ตรวจสอบวิธี integrate Tailwind กับ Nuxt version ปัจจุบัน

ตรวจ:

* dependency
* Nuxt module/plugin
* CSS entry
* config
* import
* build compatibility

หาก setup เดิมใช้วิธีเก่าหรือไม่เหมาะกับ version ปัจจุบัน ให้ปรับเป็นวิธีที่รองรับ Nuxt 4 จริง

หลังแก้ให้ทดสอบว่า Tailwind class ถูก compile ได้

---

# 5. Prisma + PostgreSQL

ตรวจและ setup foundation ให้พร้อมใช้งาน

ต้องมี:

```text
prisma/
  schema.prisma
  migrations/
  seed.ts
```

ตรวจ:

* PostgreSQL provider
* `DATABASE_URL`
* Prisma Client
* Prisma generate
* Prisma validate

หาก Domain Schema เต็มยังไม่ได้ implement:
**อย่าออกแบบ Business Schema ทั้งหมดเองในขั้นตอนนี้**

ให้สร้างเฉพาะ foundation ที่จำเป็น หรือคง placeholder ที่เหมาะสมไว้

ห้ามสร้าง model business จำนวนมากโดยเดา requirement

---

# 6. Docker Compose PostgreSQL

ตรวจหรือสร้าง Docker Compose สำหรับ PostgreSQL Local Development

เป้าหมาย:

* PostgreSQL
* persistent volume
* port ที่สอดคล้องกับ `.env`
* database name ที่สอดคล้องกับ architecture

ตรวจ:

```bash
docker compose config
docker compose ps
```

หาก container ยังไม่ทำงานและ Docker พร้อมใช้งาน ให้ start database ได้

ห้ามลบ volume หรือ reset database โดยไม่จำเป็น

---

# 7. Authentication Foundation

ตรวจว่า:

* `nuxt-auth-utils` ติดตั้งถูกต้อง
* module/config ถูกต้อง
* session secret ถูกเตรียม
* secret อยู่ server-side
* `.env.example` มี placeholder
* `.env` ไม่ถูก Git track

ยังไม่ต้อง implement Login UI หรือ RBAC business flow เต็ม หากยังไม่ถึง phase นั้น

เป้าหมายรอบนี้คือ Authentication Foundation พร้อมสำหรับ Phase ต่อไป

---

# 8. Environment Variables

ตรวจและแก้ `.env.example` ให้รองรับ:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/buriram_silk
NUXT_SESSION_PASSWORD=replace-with-at-least-32-characters
NUXT_PUBLIC_APP_BASE_URL=http://localhost:3000
UPLOAD_DIR=./storage/uploads
VALIDATOR_KEY_DIR=./storage/validator-keys
```

ห้ามใส่ secret จริงลง `.env.example`

ห้าม print secret จริงลง terminal output/report

---

# 9. `.gitignore` และ Secret Safety

ตรวจและแก้ `.gitignore`

อย่างน้อยต้อง ignore:

```text
node_modules/
.nuxt/
.output/
.env
storage/uploads/
storage/validator-keys/
```

สามารถใช้ `.gitkeep` สำหรับ directory ที่จำเป็น

ตรวจด้วย:

```bash
git status
git ls-files
```

ให้แน่ใจว่าไม่มี:

* `.env`
* password
* validator private key
* uploaded evidence
* generated secret

ถูก track

ถ้าพบ secret ถูก track:
หยุดก่อนทำ destructive history rewrite

ให้ remove จาก Git index อย่างปลอดภัยและรายงานสิ่งที่พบ

ห้าม rewrite Git history เว้นแต่ได้รับคำสั่งเพิ่มเติม

---

# 10. Project Structure

ปรับ structure ให้สอดคล้องกับ System Design:

```text
app/
  components/
    ui/
    domain/
  composables/
  layouts/
  middleware/
  pages/
  utils/

server/
  api/
  services/
  utils/
  middleware/

shared/
  types/
  utils/

prisma/
  schema.prisma
  migrations/
  seed.ts

storage/
  uploads/
  validator-keys/

test/
  unit/
  integration/
  e2e/
```

ไม่ต้องสร้างไฟล์ dummy จำนวนมาก

สร้าง directory หรือ foundation file เฉพาะที่มีประโยชน์จริง

หลีกเลี่ยง premature abstraction

โดยเฉพาะ:
**ห้ามสร้าง Generic Repository Layer**

ให้ Service สามารถใช้ Prisma ผ่าน `server/utils/db.ts` ตาม System Design

---

# 11. Shared Foundation

หากยังไม่มี ให้ setup foundation ที่ไม่ผูกกับ business logic เช่น:

```text
server/utils/db.ts
shared/types/
app/components/ui/
test/
```

แต่ห้ามเริ่ม implement feature เช่น:

* Silk Certification
* Transfer
* Blockchain Explorer
* Full RBAC
* Certificate lifecycle

ในงานนี้

---

# 12. ESLint และ Typecheck

ติดตั้งและ configure ESLint ที่เหมาะกับ Nuxt 4

ต้องสามารถรัน:

```bash
pnpm lint
pnpm typecheck
```

แก้ error ที่เกิดจาก initial scaffold/configuration

ห้ามใช้:

```text
any
@ts-ignore
eslint-disable
```

เพื่อซ่อน setup error เว้นแต่มีเหตุผลจำเป็นและอธิบายไว้

---

# 13. Testing Foundation

setup testing infrastructure:

Unit / Integration:

* Vitest
* Vue Test Utils
* DOM environment ที่เหมาะสม

E2E:

* Playwright

สร้าง test structure:

```text
test/
  unit/
  integration/
  e2e/
```

ไม่จำเป็นต้องเขียน business tests เต็ม

แต่ควรมี smoke test ขั้นพื้นฐานหากเหมาะสม เพื่อยืนยัน test runner ใช้งานได้

---

# 14. QR Dependency

เนื่องจาก architecture ต้องรองรับ QR Verification ให้ติดตั้ง QR generation library ที่เหมาะสมหากยังไม่มี

ยังไม่ต้อง implement Certificate QR feature

เป้าหมายคือ dependency foundation พร้อม

---

# 15. Blockchain Simulation Dependency

ห้ามติดตั้ง blockchain framework

Local Simulator จะใช้ Node built-in crypto ก่อน

ต้องรองรับในอนาคต:

* SHA-256
* Ed25519 Sign
* Ed25519 Verify

ใช้ `node:crypto`

ห้ามเพิ่ม:

* Web3
* ethers
* Hardhat
* Ganache
* Solidity
* Hyperledger SDK

สำหรับ Foundation Phase

---

# 16. Scripts Contract

ปรับ `package.json` ให้มี script ที่ implement ได้จริงใน phase ปัจจุบัน

ควรมีอย่างน้อย:

```text
dev
build
typecheck
lint
test
test:e2e
```

สำหรับ:

```text
db:migrate
db:seed
db:reset
ledger:verify
```

ให้เพิ่มเมื่อ implementation รองรับจริง

ห้ามสร้าง fake command เช่น:

```json
"ledger:verify": "echo ok"
```

เพียงเพื่อให้ checklist ผ่าน

หากยังไม่ implement ให้รายงานเป็น Pending

---

# 17. Safe Verification

หลังแก้ setup แล้ว ให้รัน verification

อย่างน้อย:

```bash
node --version
pnpm --version

pnpm install
pnpm exec nuxt prepare

pnpm typecheck
pnpm lint
pnpm test
pnpm build

docker compose config
docker compose ps

pnpm prisma validate
pnpm prisma generate
```

หาก Playwright พร้อม:

```bash
pnpm test:e2e
```

ถ้า test suite ยังไม่มี ให้สร้าง smoke test ขั้นต่ำที่มีประโยชน์แทนการ fake pass

---

# 18. แก้แบบ Iterative

หาก command fail:

1. อ่าน error จริง
2. หาสาเหตุ
3. แก้ root cause
4. รัน command เดิมอีกครั้ง
5. ทำซ้ำจนผ่าน หรือพบ blocker ที่ต้องการข้อมูลจากมนุษย์

ห้ามแก้ด้วยการ:

* ปิด TypeScript checking
* disable lint จำนวนมาก
* downgrade แบบสุ่ม
* force install โดยไม่เข้าใจสาเหตุ
* delete project แล้ว scaffold ใหม่ทันที
* reset database
* remove lockfile เพื่อ "ลองดู"
* hard-code secret

---

# 19. Scope Guard

งานนี้คือ:

**Foundation / Environment / Setup / Tooling**

ไม่ใช่ Feature Development

ห้ามเริ่มสร้าง:

* Weaver Dashboard
* Certification Workflow
* Transfer Workflow
* Certificate lifecycle
* Blockchain Explorer
* PoA Simulator เต็ม
* Ledger Event Catalog เต็ม
* UI business screens

จนกว่า foundation จะผ่านก่อน

Build order ตาม System Design ต้องยังคงเป็น:

```text
Foundation
→ Shared UI
→ Authentication / RBAC
→ Silk Item Workflow
→ Ledger Simulator
→ Certification
→ Certificate Status / Custody
→ Blockchain Explorer
→ Quality Gate
→ Demo
```

---

# 20. Git Rules

สามารถแก้ไฟล์ใน working tree ได้

แต่:

* ห้าม commit
* ห้าม push
* ห้าม merge
* ห้าม force push
* ห้าม rewrite history

หลังแก้เสร็จให้แสดง:

```bash
git status
git diff --stat
```

และสรุปไฟล์ที่แก้

---

# 21. Final Verification Result

หลังจากตรวจและแก้ทั้งหมดแล้ว ให้รายงาน:

## Setup Status

เลือก:

* PASS
* PARTIAL
* FAIL

## Fixed

ระบุสิ่งที่ตรวจพบและแก้ไปแล้ว

## Installed

ระบุ package ที่เพิ่ม พร้อมเหตุผล

## Removed

ระบุ package/config ที่ลบ พร้อมเหตุผล

## Configuration Changes

ระบุไฟล์ที่แก้และสาเหตุ

## Verification Results

รายงานแต่ละ command เช่น:

```text
pnpm install       PASS
nuxt prepare       PASS
typecheck          PASS
lint               PASS
test               PASS
build              PASS
prisma validate    PASS
prisma generate    PASS
docker compose     PASS
```

## Pending by Design

ระบุสิ่งที่ยังไม่ทำเพราะอยู่ใน Phase ถัดไป เช่น:

* Business Prisma Models
* RBAC implementation
* Ledger Simulator
* `ledger:verify`
* Certification Workflow

อย่านับรายการเหล่านี้เป็น Setup Failure

## Remaining Blockers

ถ้ามีสิ่งที่ Codex แก้เองไม่ได้ ให้ระบุ:

* ปัญหา
* สาเหตุ
* สิ่งที่ต้องการจากผู้ใช้

## Git Changes

สรุป:

* modified files
* new files
* deleted files

## Ready for Development?

ตอบ:

**YES**

หรือ

**NO**

พร้อมเหตุผล

ถ้า YES ให้ระบุด้วยว่า Phase ถัดไปตาม `system-design.md` คืออะไร

---

ทำงานแบบ engineering loop:

**Inspect → Diagnose → Fix → Verify → Re-inspect**

อย่าหยุดหลังแก้ error แรก ให้ตรวจ foundation ทั้งหมดจนจบ scope นี้
