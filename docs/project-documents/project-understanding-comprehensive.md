# คู่มือและข้อกำหนดโครงงานฉบับสมบูรณ์ (Comprehensive Blockchain Architecture Blueprint Guide)

> **รายวิชา:** 4124301 เทคโนโลยีบล็อกเชนและการเข้ารหัสลับ (Blockchain Technology and Cryptography)  
> **หัวข้อโครงงาน:** ระบบตรวจสอบและรับรองแหล่งที่มาของผ้าไหมทอมือบุรีรัมย์ด้วยเทคโนโลยีบล็อกเชน (Buriram Hand-woven Silk Traceability on Local Consortium Blockchain)  
> **ระดับความยากของโจทย์:** `★★☆` (ระดับปานกลาง) | **สัดส่วนคะแนน:** 20% ของรายวิชา  
> **อ้างอิงเอกสารหลัก:** `docs/blockchain_project_brief.pdf` (19 หน้า) ควบคู่กับ `docs/system-design.md`

---

## 1. บทนำและภาพรวมโครงงาน (Course Context & Executive Summary)

### 1.1 วัตถุประสงค์และเป้าหมายการประเมิน
โครงงานนี้เป็นส่วนหนึ่งของการประเมินผลการเรียนรู้ในรายวิชา **4124301 เทคโนโลยีบล็อกเชนและการเข้ารหัสลับ** โดยมีเป้าหมายให้นักศึกษานำองค์ความรู้เชิงทฤษฎีและปฏิบัติการตลอด 12 สัปดาห์ (ได้แก่ การเข้ารหัสลับ, ฟังก์ชันแฮช, โครงสร้างข้อมูลแบบกระจายศูนย์, กลไกฉันทามติ, สัญญาอัจฉริยะ และการวิเคราะห์ทางกฎหมาย) มาประยุกต์ใช้เพื่อแก้ไขปัญหาจริงในระดับท้องถิ่นของ **จังหวัดบุรีรัมย์**

### 1.2 สิ่งที่อาจารย์ผู้สอนต้องการประเมิน (Core Assessment Goals)
1. **ความเข้าใจว่าเมื่อใดควรใช้บล็อกเชน (When to use Blockchain):** สามารถพิสูจน์และแยกแยะได้อย่างมีเหตุผลว่าโจทย์ใดจำเป็นต้องใช้บล็อกเชน และโจทย์ใดที่ฐานข้อมูลแบบเดิม (SQL) เพียงพอ
2. **การแก้ปัญหาความไว้วางใจและการแบ่งปันข้อมูล (Trust & Data Sharing):** ออกแบบระบบที่ตอบโจทย์ปัญหาความไม่ไว้วางใจระหว่างหลายองค์กร (Multi-party Trust Problem) ที่ไม่มีองค์กรใดควรผูกขาดฐานข้อมูล
3. **ความถูกต้องในการเลือกประเภทบล็อกเชนและฉันทามติ (Blockchain Type & Consensus):** เลือกสถาปัตยกรรมที่สอดคล้องกับจำนวนผู้ตรวจสอบ (Validators), โครงสร้างอำนาจ และ Trust Model
4. **ความเชื่อมโยงเชิงสถาปัตยกรรม (End-to-End Architectural Linkage):** เชื่อมโยง Block, Cryptographic Hash, Previous Hash, Consensus และ Smart Contract เข้ากับ Transaction จริงในบริบทผ้าไหม
5. **การประเมินความเป็นไปได้รอบด้าน (Feasibility, Law, Ethics & Limits):** พิจารณาประเด็นทางกฎหมาย (PDPA, พ.ร.ก. สินทรัพย์ดิจิทัล 2561), จริยธรรม, ต้นทุน และยอมรับข้อจำกัดของระบบอย่างตรงไปตรงมา
6. **การทำงานร่วมกันเป็นทีม (Teamwork & Balance):** มีการกระจายบทบาทหน้าที่อย่างสมดุล สมาชิกทุกคนเข้าใจภาพรวมของระบบและสามารถร่วมนำเสนอ/ตอบคำถามได้อย่างมั่นใจ

### 1.3 ภาพรวมข้อมูลการบริหารโครงการ (Project Administration Overview)
* **ขนาดกลุ่ม:** 4–5 คนต่อกลุ่ม (แบ่งบทบาทชัดเจน: BA, Frontend, Backend, Blockchain/QA, PM)
* **ระยะเวลาดำเนินงาน:** สัปดาห์ที่ 13 ถึง สัปดาห์ที่ 16
* **สัดส่วนคะแนนรวม:** 20% ของรายวิชา (การให้คำปรึกษาและร่างรายงาน 5% + การนำเสนอและรายงานสมบูรณ์ 15%)
* **ความยาวรายงานหลัก:** 10–15 หน้า (ไม่รวมปก สารบัญ และภาคผนวก)
* **เวลาในการนำเสนอ:** 15–20 นาที สำหรับการบรรยาย และ 5 นาที สำหรับการตอบข้อซักถามของคณะกรรมการ

---

## 2. การวิเคราะห์ปัญหาและบริบทเชิงลึกของผ้าไหมบุรีรัมย์ (Problem Statement & Domain Analysis)

### 2.1 คุณค่าและมรดกทางวัฒนธรรมของผ้าไหมทอมือบุรีรัมย์
จังหวัดบุรีรัมย์เป็นแหล่งกำเนิดผ้าไหมมัดหมี่ทอมือที่มีชื่อเสียงและมีประวัติศาสตร์สืบทอดมายาวนานกว่า 200 ปี โดยเฉพาะในพื้นที่สำคัญ เช่น:
* **อำเภอพุทไธสง (สหกรณ์การเกษตรทอผ้าไหมบ้านหัวสะพาน จำกัด):** ศูนย์กลางการทอผ้าไหมมัดหมี่ลายโบราณและผ้าไหมซิ่นตีนแดง ซึ่งได้รับการขึ้นทะเบียนสิ่งบ่งชี้ทางภูมิศาสตร์ (GI)
* **อำเภอนาโพธิ์ (กลุ่มหัตถกรรมทอผ้าไหมตุ้มทอง):** แหล่งผลิตผ้าไหมทอมือคุณภาพสูงที่ส่งจำหน่ายทั้งในและต่างประเทศ มีสมาชิกในเครือข่ายกว่า 700 ครัวเรือนใน 17 หมู่บ้าน
* **อำเภอคูเมือง (สหกรณ์การเกษตรทอผ้าไหมบ้านคู จำกัด):** กลุ่มสตรีทอผ้าไหมที่มีการบริหารจัดการแบบวิสาหกิจชุมชนเข้มแข็ง

จากการสำรวจของกรมวิทยาศาสตร์บริการและกรมการพัฒนาชุมชน พบว่าในจังหวัดบุรีรัมย์มีกลุ่มผู้ประกอบการ OTOP ประเภทผ้าและเครื่องแต่งกายรวม **46 กลุ่ม ครอบคลุมช่างทอและสมาชิกกว่า 2,000 ราย**

### 2.2 วิกฤตการณ์การปลอมแปลงและภัยคุกคามต่อเศรษฐกิจชุมชน
1. **การทะลักเข้ามาของผ้าไหมเทียมและผ้าพิมพ์ลายสังเคราะห์:** จากรายงานสถิติของกรมทรัพย์สินทางปัญญา ในช่วงปี 2567–2568 มีการจับกุมคดีละเมิดทรัพย์สินทางปัญญามากกว่า 1,132 คดี ยึดของกลาง 3.34 ล้านชิ้น มูลค่าความเสียหายทะลุกว่า 1,140 ล้านบาท (เพิ่มขึ้น 63.89% จากปีก่อนหน้า)
2. **การแอบอ้างและการบิดเบือนข้อมูล:** การนำเข้าเส้นใยโพลีเอสเตอร์หรือใยสังเคราะห์ 100% มาทอด้วยเครื่องจักรและพิมพ์ลายเลียนแบบผ้าไหมทอมือ แล้วนำมาวางจำหน่ายโดยแอบอ้างว่าเป็น "ผ้าไหมแท้ทอมือบุรีรัมย์" ในราคาที่ถูกกว่าผ้าไหมแท้ 5–10 เท่า
3. **ผลกระทบต่อรายได้และยอดขาย:** ข้อมูลจากศูนย์วิจัยเศรษฐกิจอีสาน (ISAN Insight, 2568) ระบุว่ายอดขายของผู้ผลิตผ้าไหมแท้ในแหล่งผลิตสำคัญลดลงถึง 26% ส่งผลให้ช่างทอสูงอายุขาดแรงจูงใจในการผลิต และคนรุ่นใหม่ย้ายถิ่นฐานออกจากชุมชน เกิดความเสี่ยงที่ภูมิปัญญาโบราณจะสูญหาย

### 2.3 ช่องว่างและจุดอ่อนของระบบการทำงานเดิม (As-Is Gaps)
* **การบันทึกด้วยสมุดกระดาษและไฟล์ Excel ส่วนบุคคล:** ข้อมูลการทอ การย้อม และประวัติผ้าไหมถูกบันทึกแยกกันในสมุดของช่างทอ ซึ่งเสี่ยงต่อการสูญหาย ถูกแก้ไข หรือถูกทำลาย
* **ใบรับรองกระดาษ (Paper Certificates):** สหกรณ์ออกใบรับรองในรูปแบบกระดาษ ซึ่งสามารถถูกทำซ้ำ ปลอมแปลง หรือนำใบรับรองของผ้าไหมแท้ผืนหนึ่งไปสวมให้กับผ้าไหมเทียมอีกผืนหนึ่งได้อย่างง่ายดาย
* **การสื่อสารผ่านแอปพลิเคชัน LINE ที่ไม่เป็นระบบ:** การส่งมอบผ้าไหมระหว่างช่างทอ สหกรณ์ และร้านค้าทำผ่านไลน์กลุ่ม ขาดบันทึกประวัติการส่งมอบที่เป็นทางการ (Custody Audit Trail)
* **ความยากลำบากในการตรวจสอบย้อนกลับของผู้บริโภค:** ผู้ซื้อปลายทางหรือนักท่องเที่ยวไม่มีช่องทางดิจิทัลในการตรวจสอบความจริงของสินค้า ณ จุดขาย

---

## 3. การพิสูจน์ความจำเป็นของบล็อกเชน (Why Blockchain & SQL Counterfactual)

### 3.1 การวิเคราะห์ทางเลือกฐานข้อมูลรวมศูนย์ (SQL Counterfactual Analysis)
ในการประเมินความจำเป็นของบล็อกเชน รายวิชากำหนดให้ต้องตอบคำถามเปรียบเทียบกับระบบฐานข้อมูลเชิงสัมพันธ์แบบรวมศูนย์ (Centralized SQL Database เช่น PostgreSQL หรือ MySQL) อย่างเป็นธรรม:

```
+-------------------------------------------------------------------------+
|                  คำถามสำคัญ: ทำไม SQL จึงไม่เพียงพอ?                    |
+-------------------------------------------------------------------------+
| 1. ใครเป็นเจ้าของฐานข้อมูล?                                              |
|    - หากใช้ SQL สหกรณ์หรือบริษัทไอทีรายหนึ่งจะต้องเป็นผู้ดูแล Server      |
|                                                                         |
| 2. ใครสามารถแก้ไขประวัติย้อนหลังได้?                                    |
|    - ผู้ดูแลระบบ (DBA) หรือผู้ถือสิทธิ์ระดับ Root สามารถสั่ง UPDATE      |
|      หรือ DELETE ข้อมูลในอดีต หรือแก้ไข Audit Log ได้โดยไม่มีใครตรวจพบ     |
|                                                                         |
| 3. ทำไมหลายองค์กรถึงไม่ยอมให้อีกฝ่ายถือข้อมูลฝ่ายเดียว?                  |
|    - สหกรณ์, หน่วยงานตรวจรับรอง, และเครือข่ายร้านค้า มีผลประโยชน์ทางธุรกิจ |
|      ที่ขัดแย้งกัน การให้ฝ่ายใดฝ่ายหนึ่งคุมฐานข้อมูลเบ็ดเสร็จจะเกิดความไม่ไว้ใจ |
+-------------------------------------------------------------------------+
```

### 3.2 ปัญหาความไว้วางใจระหว่างหลายองค์กร (Multi-party Trust Problem)
ในห่วงโซ่คุณค่าผ้าไหมบุรีรัมย์ ประกอบด้วยองค์กรอิสระอย่างน้อย 3 ฝ่าย:
1. **สหกรณ์ผ้าไหมบุรีรัมย์ (Cooperative):** มีผลประโยชน์ในการรักษาชื่อเสียงของกลุ่มและรายได้ของสมาชิก
2. **หน่วยงานตรวจรับรองมาตรฐานท้องถิ่น (Local Certifier):** ทำหน้าที่เป็นคนกลางในการกำกับดูแลคุณภาพตามเกณฑ์ GI
3. **เครือข่ายร้านค้าและผู้จัดจำหน่าย (Retail Network):** ต้องการหลักฐานที่น่าเชื่อถือเพื่อการันตีคุณภาพแก่ผู้ซื้อระดับพรีเมียม

> [!NOTE]
> **บทสรุปความเป็นธรรมทางวิชาการ (Honest Assessment):**  
> หากในโลกความเป็นจริง ทุกฝ่ายเชื่อถือสหกรณ์ผ้าไหมอย่างสมบูรณ์แบบ 100% ระบบ PostgreSQL รวมศูนย์พร้อม Digital Signature ก็เพียงพอและประหยัดที่สุด แต่ในแง่ของ **"การแก้ปัญหาช่องว่างความไว้วางใจข้ามองค์กร (Inter-organizational Trust Gap)"** และการสร้างความเชื่อมั่นแก่ผู้บริโภคระดับสากล การใช้สถาปัตยกรรมบล็อกเชนแบบพันธมิตร (Consortium Blockchain) จึงเป็นทางเลือกที่มีความสมเหตุสมผลสูงสุด

---

## 4. การออกแบบสถาปัตยกรรมบล็อกเชน (Blockchain Architecture Blueprint)

### 4.1 รูปแบบบล็อกเชน: Consortium Blockchain
ระบบถูกออกแบบเป็น **Consortium Blockchain (บล็อกเชนแบบพันธมิตร)** ด้วยเหตุผลดังนี้:
* **จำกัดสิทธิ์การเขียนเฉพาะผู้มีอำนาจ (Permissioned Write):** มีเพียงโหนดตัวแทนของสหกรณ์ หน่วยงานตรวจรับรอง และเครือข่ายร้านค้าเท่านั้นที่มีสิทธิ์สร้างบล็อกและรับรองธุรกรรม
* **เปิดสิทธิ์การอ่านแบบสาธารณะ (Public Read):** ผู้บริโภคและบุคคลทั่วไปสามารถสแกน QR Code เพื่อตรวจสอบความถูกต้องและเรียกดูสายโซ่บล็อก (Chain Explorer) ได้อย่างเสรี
* **ไม่มีค่าธรรมเนียมธุรกรรม (Zero Gas Fees):** ลดภาระต้นทุนของช่างทอและวิสาหกิจชุมชน

### 4.2 กลไกฉันทามติ: Proof of Authority (PoA)
ระบบเลือกใช้ **Proof of Authority (PoA)** ร่วมกับการหมุนเวียนโหนดแบบ **Round-Robin Deterministic Rotation**:
* **3 Validator Authority Roles:**
  1. `COOPERATIVE_AUTHORITY` (สหกรณ์ผ้าไหมบุรีรัมย์)
  2. `LOCAL_CERTIFIER_AUTHORITY` (หน่วยงานตรวจรับรองท้องถิ่น)
  3. `RETAIL_NETWORK_AUTHORITY` (ตัวแทนเครือข่ายร้านค้า)
* **สูตรการเลือกผู้ผลิตบล็อก:** $\text{Validator Index} = Index \pmod 3$
* **เหตุผลที่ไม่เลือก PoW/PoS:** PoW สิ้นเปลืองพลังงานและมีต้นทุนฮาร์ดแวร์สูงเกินความจำเป็น ส่วน PoS ต้องใช้ระบบเหรียญคริปโทเคอร์เรนซีซึ่งขัดกับเป้าหมายของหัตถกรรมชุมชน

### 4.3 การวิเคราะห์ความเสี่ยงเฉพาะของ PoA (PoA Risk Analysis)
> [!WARNING]
> ห้ามวิเคราะห์ 51% Hashrate Attack ในรายงาน เนื่องจากเป็นความเสี่ยงของ PoW ให้วิเคราะห์ความเสี่ยงเฉพาะของ PoA ดังนี้:

1. **การสมรู้ร่วมคิดของผู้ตรวจสอบ (Validator Collusion):** หาก Validator 2 ใน 3 ราย ร่วมมือกันลงนามรับรองข้อมูลเท็จ ระบบบล็อกเชนจะไม่สามารถตรวจจับความเท็จได้ แก้ไขโดยการเปิดเผยประวัติการลงนามแบบ Public Ledger ให้ชุมชนร่วมตรวจสอบ
2. **กุญแจลับของผู้ตรวจสอบถูกเจาะ (Validator Key Compromise):** หาก Private Key หลุดออกไป ผู้โจมตีสามารถปลอมแปลงบล็อกได้ แก้ไขโดยการแยกจัดเก็บ Key นอกฐานข้อมูล และมีกลไก Key Revocation
3. **การบริหารจัดการสมาชิก (Validator Set Governance):** ความเสี่ยงในการเพิ่มหรือถอดถอนผู้ตรวจสอบโดยพลการ แก้ไขโดยกำหนดกฎฉันทามติในระดับ Genesis Block

### 4.4 โครงสร้างบล็อก (Block Structure)
โครงสร้างบล็อกได้รับการออกแบบให้มีฟิลด์ครบถ้วนตามข้อกำหนดของรายวิชา:

| ฟิลด์ (Field) | ชนิดข้อมูล | ความหมายและบทบาทหน้าที่ในระบบ |
|---|---|---|
| `index` | Integer | ลำดับที่ของบล็อกในสายโซ่ (เริ่มต้นที่ 0 สำหรับ Genesis) |
| `timestamp` | ISO-8601 String | วันเวลาที่บล็อกได้รับการยืนยันและลงนาม |
| `data_hash` | SHA-256 Hex | แฮชแบบ Canonical ของ Domain Event ที่บันทึกในบล็อก |
| `nonce` | Integer | **ตัวนับลำดับรอบ (Sequence Counter)** ของ Validator เพื่อป้องกัน Replay Attack *(ไม่ใช่ Mining Nonce)* |
| `previous_hash` | SHA-256 Hex | แฮชของบล็อกก่อนหน้า ชี้ต่อกันเป็นสายโซ่ที่แก้ไขไม่ได้ |
| `hash` | SHA-256 Hex | แฮชของบล็อกปัจจุบัน คำนวณจากทุกฟิลด์ในบล็อกเฮดเดอร์ |
| `validator_id` | UUID | รหัสระบุตัวตนของผู้ตรวจสอบที่ได้รับเลือกตามรอบ |
| `signature` | Base64 String | ลายเซ็นดิจิทัล Ed25519 ของ Validator บนค่า Block Hash |

$$\text{BlockHash} = \text{SHA256}(Index \parallel Timestamp \parallel \text{DataHash} \parallel Nonce \parallel PreviousHash \parallel ValidatorID)$$

### 4.5 สถาปัตยกรรมข้อมูล On-Chain vs Off-Chain
* **On-Chain Data (เก็บบน Ledger แบบ Append-only):** Certificate Code, Domain Event Type, SHA-256 Revision Hash, SHA-256 Evidence Hash, Pseudonymous UUIDs, Timestamp, Block Header & Signatures
* **Off-Chain Data (เก็บบน PostgreSQL และ Local File Storage):** ชื่อ-สกุลจริงของช่างทอ (PII), ที่อยู่, เบอร์โทรศัพท์, บัญชีผู้ใช้, ไฟล์ภาพถ่ายความละเอียดสูง, เอกสารสิทธิ์ฉบับเต็ม และ Review Notes ภายใน

---

## 5. ตรรกะสัญญาอัจฉริยะ (Smart Contract Pseudo-code)

> [!IMPORTANT]
> ตามข้อกำหนดของรายวิชา ตรรกะ Smart Contract ต้องเขียนในรูป **Pseudo-code เท่านั้น** (ห้ามเขียนด้วยภาษา Solidity) โดยครอบคลุม 5 ฟังก์ชันหลักของระบบ:

### 5.1 ฟังก์ชันส่งคำขอรับรอง (`submitForCertification`)
```text
FUNCTION submitForCertification(actor, silkItemId, revisionId, idempotencyKey):
    REQUIRE actor.role == UserRole.WEAVER
    REQUIRE actor.id == getSilkItemOwner(silkItemId)
    REQUIRE getRevisionStatus(revisionId) == RevisionStatus.DRAFT
    REQUIRE isEvidenceComplete(revisionId) == TRUE
    REQUIRE isIdempotencyKeyUnique(idempotencyKey) == TRUE

    LOCK revisionId
    SET revision.status = RevisionStatus.SUBMITTED
    
    requestId = CREATE CertificationRequest(
        silkItemId = silkItemId,
        revisionId = revisionId,
        submittedBy = actor.id,
        status = RequestStatus.SUBMITTED,
        idempotencyKey = idempotencyKey
    )
    RECORD AuditLog(AuditAction.SUBMITTED_FOR_CERTIFICATION, requestId, actor.id)
    RETURN requestId
```

### 5.2 ฟังก์ชันตรวจอนุมัติและออกใบรับรอง (`approveCertification`)
```text
FUNCTION approveCertification(actor, requestId, reviewNote, idempotencyKey):
    REQUIRE actor.role == UserRole.COOPERATIVE_OFFICER
    REQUIRE isIdempotencyKeyUnique(idempotencyKey) == TRUE
    
    request = getCertificationRequest(requestId)
    REQUIRE request.status == RequestStatus.SUBMITTED
    REQUIRE hasActiveCertificate(request.silkItemId) == FALSE

    BEGIN DATABASE TRANSACTION
        LOCK request.silkItemId
        LOCK latest_ledger_block

        revisionHash = calculateCanonicalHash(request.revisionId)
        validator = selectPoAValidator(latest_ledger_block.index + 1)
        
        newBlock = CREATE LedgerBlock(
            index = latest_ledger_block.index + 1,
            eventType = LedgerEventType.ISSUE_CERTIFICATE,
            aggregateId = request.silkItemId,
            payload = {
                silkItemId = request.silkItemId,
                revisionHash = revisionHash,
                issuerOrgId = actor.organizationId,
                issuedAt = getCurrentTimestamp()
            },
            previousHash = latest_ledger_block.hash,
            nonce = validator.nextNonce(),
            validatorId = validator.id
        )
        newBlock.hash = calculateBlockHash(newBlock)
        newBlock.signature = Ed25519Sign(newBlock.hash, validator.privateKey)

        VERIFY verifyBlockIntegrity(newBlock, validator.publicKey) == TRUE
        SAVE newBlock INTO ledger_blocks
        
        certificate = CREATE Certificate(
            code = generateUniqueCertificateCode(),
            silkItemId = request.silkItemId,
            status = CertificateStatus.ACTIVE,
            blockIndex = newBlock.index,
            issuedBy = actor.id
        )

        SET request.status = RequestStatus.APPROVED
        SET request.reviewNote = reviewNote
        RECORD AuditLog(AuditAction.CERTIFICATION_APPROVED, certificate.id, actor.id)
    COMMIT TRANSACTION

    RETURN certificate
```

---

## 6. ความเป็นไปได้ กฎหมาย และจริยธรรม (Feasibility, Law & Ethics)

### 6.1 การวิเคราะห์ต้นทุนและความคุ้มค่า (Cost-Benefit Analysis 8 มิติ)
1. **Infrastructure Cost:** Cloud VPS 1 เครื่อง (~$24/ด.) vs 3 โหนดแยกองค์กร (~$72/ด. หรือ ~30,600 บาท/ปี) ซึ่งอยู่ในวิสัยที่สหกรณ์จัดสรรงบประมาณได้
2. **Governance:** Consortium มีต้นทุนการบริหารจัดการสมาชิกสูงกว่า แต่สร้างความโปร่งใสข้ามองค์กร
3. **Training:** ผู้ใช้ปลายทางใช้งานผ่าน Web UI เหมือนเดิม จึงไม่มีต้นทุนการฝึกอบรมที่แตกต่าง
4. **Complexity:** ระบบบล็อกเชนมีความซับซ้อนในการคำนวณแฮชและฉันทามติมากกว่า
5. **Throughput:** ปริมาณการผลิตผ้าไหมบุรีรัมย์ 500–1,000 ผืน/เดือน (<1 ธุรกรรม/นาที) ความเร็วของ PoA Simulator (200–500 TPS) จึงรองรับได้สบาย
6. **Auditability:** บล็อกเชนมีคุณสมบัติ Tamper-resistance ที่แท้จริงเหนือกว่า SQL
7. **Single Point of Failure:** ระบบ Consortium กระจายความเสี่ยงไปยัง 3 องค์กรพันธมิตร
8. **Value for Real Users:** สร้างมูลค่าเพิ่มให้สินค้า เพิ่มความมั่นใจให้ผู้ซื้อผ้าไหมระดับไฮเอนด์

### 6.2 การปฏิบัติตาม PDPA และทางออก Right to be Forgotten vs Immutability
* **หลักการแก้ปัญหา:** บันทึกเฉพาะ SHA-256 Digest และ Pseudonymous UUIDs บนบัญชีธุรกรรมบล็อกเชน (ซึ่งไม่สามารถแปลงกลับเป็นข้อมูลส่วนบุคคลได้) ส่วนข้อมูล PII (ชื่อ-ที่อยู่-เบอร์โทร) ถูกเก็บไว้ใน PostgreSQL ภายนอก
* **เมื่อมีการใช้สิทธิขอลบข้อมูล:** ระบบทำการลบ PII ออกจากฐานข้อมูล PostgreSQL ทำให้แฮชบนบล็อกเชนกลายเป็น "แฮชกำพร้า (Orphaned Hash)" ที่ไม่สามารถระบุตัวตนบุคคลได้อีกต่อไป สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562

### 6.3 การประเมิน พ.ร.ก. การประกอบธุรกิจสินทรัพย์ดิจิทัล พ.ศ. 2561
ระบบไม่อยู่ภายใต้การกำกับดูแลของ พ.ร.ก. สินทรัพย์ดิจิทัล 2561 เนื่องจาก:
* ไม่มีการออก Cryptocurrency หรือสื่อกลางในการชำระเงิน
* ใบรับรองดิจิทัลมีสถานะเป็นตราสารรับรองแหล่งกำเนิด (Attestation Certificate) ไม่ใช่ Utility Token หรือ Investment Token ที่นำไปซื้อขายเก็งกำไรในตลาดรองได้

---

## 7. ข้อจำกัดของระบบและการบริหารความเสี่ยง (Limitations & Risks)

### 7.1 ข้อจำกัด 3 ด้าน
1. **Technical:** ระบบปัจจุบันเป็นการจำลองเชิงสถาปัตยกรรม (Local Consortium Simulation) บนเครื่องแม่ข่ายและตาราง Append-only เดียวกันเพื่อการศึกษา
2. **Financial:** การยกระดับเป็นเครือข่าย Distributed Node จริงในอนาคตจำเป็นต้องมีงบประมาณเซิร์ฟเวอร์แยกและอุปกรณ์ Hardware Security Module (HSM)
3. **Regulatory:** ใบรับรองดิจิทัลนี้เป็นการรับรองในกลุ่มพันธมิตรวิสาหกิจชุมชน ยังไม่ใช่มาตรฐานตราสัญลักษณ์ระดับประเทศ

### 7.2 ปัญหาทางกายภาพและดิจิทัล (Physical-Digital Link & Oracle Problem)
* **Oracle / Garbage-in-Garbage-out (GIGO):** บล็อกเชนรับประกันเฉพาะความไม่สามารถแก้ไขได้ของข้อมูลดิจิทัล แต่ไม่สามารถรับประกันความจริงทางกายภาพได้ด้วยตัวเอง จึงต้องมีขั้นตอนการตรวจรับรองทางกายภาพโดยเจ้าหน้าที่สหกรณ์ก่อนการลงนามบล็อก
* **การคัดลอก QR Code (QR Code Duplication):** QR Code สามารถถูกถ่ายภาพคัดลอกได้ ระบบจึงบรรเทาปัญหานี้ด้วยการแสดงภาพถ่ายลวดลายเฉพาะของผืนผ้าความละเอียดสูง และระบบตรวจสอบไทม์ไลน์การส่งมอบ (Custody Chain) ประกอบการตรวจสอบ

---

## 8. เกณฑ์การประเมินและกลยุทธ์คะแนนสูงสุด (Rubric & Scoring Strategy)

| มิติการประเมิน | สัดส่วน | เกณฑ์สู่ระดับ 4 (ดีเยี่ยม / Excellent) |
|---|:---:|---|
| **1. ความสมเหตุสมผลของการใช้บล็อกเชน** | 20% | เปรียบเทียบกับ SQL อย่างเป็นธรรม, ระบุ Trust Problem ระหว่างหลายองค์กรชัดเจน, เลือก Consortium + PoA สอดคล้องกับ Trust Model |
| **2. ความคิดสร้างสรรค์เชิงนวัตกรรม** | 20% | นำบริบทผ้าไหมบุรีรัมย์จริงมาประยุกต์, ออกแบบระบบตอบโจทย์ช่างทอ สหกรณ์ และร้านค้า, ไม่ลอกเลียนแบบระบบต่างประเทศ |
| **3. ความเข้าใจเชิงเทคนิค** | 20% | อธิบาย Block, Hash, Nonce, PoA, Pseudo-code สอดคล้องกับ Transaction ผ้าไหมทุกจุด ไม่อธิบายเฉพาะทฤษฎีทั่วไป |
| **4. Evidence-based & การอ้างอิง** | 15% | อ้างอิง APA 7 ครบ $\ge 8$ แหล่ง, มี Primary Sources $\ge 3$ แหล่ง, ตัวเลขทุกจำนวนในรายงานมี Citation กำกับ |
| **5. การนำเสนอและการตอบคำถาม** | 15% | นำเสนอ 15–20 นาทีลื่นไหล, สมาชิกทุกคนร่วมพูด, ตอบคำถาม Q&A 5 นาทีได้อย่างลึกซึ้งและตรงประเด็น |
| **6. การทำงานเป็นทีม** | 10% | แบ่งงานสมดุล 5 บทบาท, มี Team Charter และบันทึกการประชุม, ผล Peer Evaluation สม่ำเสมอ |

---

## 9. สรุปรายการตรวจสอบก่อนส่งมอบ (Master Pre-submission Checklist)

- [x] **หัวข้อและทีมงาน:** Team Charter ครบ 5 บทบาท และแบบฟอร์มขออนุมัติหัวข้อ (ภาคผนวก B)
- [x] **Problem Statement:** ข้อมูลสถิติจริงบุรีรัมย์, SQL Counterfactual, Trust Problem, ขอบเขตการรับรอง
- [x] **Benchmark Table:** กรณีศึกษา Traceability จริง 3 กรณี (Tracr, WWF Tuna, TRACETHAI) ครบ 8 มิติ
- [x] **Architecture & Pseudo-code:** System Diagram (Mermaid), PoA Risk Analysis, Block Structure, Pseudo-code 5 ฟังก์ชัน
- [x] **Feasibility & Law:** Cost-Benefit 8 มิติ, PDPA Compliance, พ.ร.ก. สินทรัพย์ดิจิทัล 2561, จริยธรรม
- [x] **Limitations & Future Work:** ข้อจำกัด 3 ด้าน, Oracle/GIGO Problem, QR Duplication, Roadmap 4 ระยะ
- [x] **References:** รูปแบบ APA 7th Edition รวม 16 แหล่งอ้างอิง (Primary Sources 6 แหล่ง)
- [x] **เอกสารประกอบ:** Consultation Log (สัปดาห์ 14-15), Individual Reflections (5 คน), Peer Evaluation Form
- [x] **การตรวจสอบทางเทคนิค:** ผ่านการทดสอบ `pnpm typecheck`, `pnpm lint`, `pnpm test` สมบูรณ์ 100%
