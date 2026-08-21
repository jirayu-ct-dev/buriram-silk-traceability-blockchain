# 2. Benchmark Table — การเปรียบเทียบกรณีศึกษา Traceability จริง

## 2.1 กรณีศึกษาที่เลือกศึกษา

### กรณีศึกษาที่ 1: Tracr — Diamond Traceability Platform (De Beers Group)

**Trust Model:** Consortium Blockchain ที่ควบคุมโดย De Beers Group แต่เริ่มต้น แต่ขยายขยายเปิดให้ miner อื่นเข้าร่วม (De Beers Group, 2024)

**Blockchain Type/Consensus:** Private Blockchain ด้วยการควบคุมของ De Beers Group ใช้ Blockchain สำหรับบันทึกประวัติของเพชร (Accenture, 2024)

**On-chain Data:** 
- Digital identity ของเพชร (carat weight, colour, clarity, cut)
- ประวัติการเปลี่ยนเจ้าของจาก mine ถึง market
- Rough scan และ polished scan สำหรับ verification
- ข้อมูล single country-of-origin สำหรับเพชร > 1 carat

**Off-chain Data:**
- ข้อมูลเพิ่มเติมที่ไม่จำเป็นต้องบันทึกบน blockchain
- ข้อมูลการสแกนและการประมวลผลิต

**ข้อจำกัด:**
- เป็นระบบที่ควบคุมโดยบริษัทหนึ่ง (De Beers) ในช่วงแรกเริ่มต้น
- ต้องมีการลงทุนสูงใน IoT และ AI สำหรับ scanning
- ต้องมี RJC membership เพื่อเข้าร่วมระบบ
- เป็นระบบที่เฉพาะสำหรับอุตสาหกรรมเพชรเท่านั้น

---

### กรณีศึกษาที่ 2: WWF Blockchain Tuna Project — Pacific Islands Tuna Fishery

**Trust Model:** Consortium Blockchain ระหว่างหลายองค์กร (WWF-New Zealand, WWF-Australia, WWF-Fiji, ConsenSys, TraSeable, Sea Quest Fiji) (WWF-New Zealand, 2018)

**Blockchain Type/Consensus:** Public Blockchain (Ethereum-compatible) หรือ Private Blockchain สำหรับ pilot project (Office of the Prime Minister's Chief Science Advisor New Zealand, 2021)

**On-chain Data:**
- ข้อมูลที่จับ (where and when the fish was caught)
- ข้อมูลเรือ (which vessel it was caught by)
- วิธีการจับ (what fishing method was used)
- ข้อมูลการประมวลที่ processing facility

**Off-chain Data:**
- ข้อมูล biosecurity และ productivity ที่ไม่จำเป็นต้องบน blockchain
- ข้อมูลเกี่ยวับ human rights และ working conditions

**ข้อจำกัด:**
- ต้องใช้ RFID tag ที่ติดตั้งกับเพชรเมื่อ landed
- ต้องมี internet access ที่ดีในพื้นที่ทะเล (patchy internet access)
- ต้องมีความทนานในการใช้งานระบบ (buy-in)
- ต้องมี tablets สำหรับเปลี่ยนจากกระดานบันทึก
- ต้องมี tags ที่ทนทานต่อสภาพแวดล้อม (durable in rough conditions)

---

### กรณีศึกษาที่ 3: TRACETHAI.com — Thai Organic Rice Traceability

**Trust Model:** Consortium Blockchain ที่ควบคุมโดย ภาครัฐ (กรมวิทยาศาสตร์บริการ กระทรวงพาณิชย์) ร่วมกับหน่วยงานราชการและธนาคาร (สนค., 2566)

**Blockchain Type/Consensus:** Private Blockchain หรือ Consortium Blockchain สำหรับระบบ TRACETHAI.com (สนค., 2566)

**On-chain Data:**
- ข้อมูลการผลิตและการค้าบน blockchain network
- ข้อมูลการรับรองมาตรฐานอินทรีย์
- QR code หรือ lot number สำหรับตรวจสอบ

**Off-chain Data:**
- ข้อมูลการปลูก การเลี้ยง การเก็บ และการบรรจุ
- ข้อมูลการแปรรูปและการจำหน่าย
- ข้อมูลเกี่ยวกับ carbon footprint และ sustainability

**ข้อจำกัด:**
- ต้องมี camera ติดตั้งในนาข้าวิ่อเป็น organic rice จริง
- ต้องมีการตรวจสอบจากหน่วยงานตรวจรับรอง (Certification body)
- ต้องมีการศึกษาและให้ความรู้แก่เกษตรกร
- ต้องมี startup costs สำหรับการนำไปใช้งานระบบ
- ต้องมี rural access ที่ดีสำหรับเกษตรกร

---

## 2.2 ตารางเปรียบเทียบมิติ

| มิติ | Tracr (Diamond) | WWF Tuna (Seafood) | TRACETHAI (Thai Organic Rice) | ผ้าไหมบุรีรัมย์ (เรา) |
|---|---|---|---|---|
| **Trust Model** | Consortium (De Beers → หลายองค์กร) | Consortium (WWF + Tech + Fishing Co) | Consortium (Government + Bank + Certifiers) | Consortium (สหกรณ + หน่วยงานตรวจรับรอง + เครือข่ายร้านค้า) |
| **Blockchain Type** | Private (De Beers-controlled) | Public/Private (Ethereum-compatible) | Private/Consortium (Government-controlled) | Private/Consortium (Local Simulation) |
| **Consensus** | ไม่ระบุ (ควบคุมโดย De Beers) | PoW/PoS (Ethereum-compatible) | ไม่ระบุ (Government-controlled) | PoA (Proof of Authority) — 3 Validator Roles |
| **On-chain Data** | Digital identity, Rough/Polished scans, Country-of-origin | Catch data, Vessel, Fishing method, Processing data | Production/trade data, Certification info, QR/lot number | Certificate code, Hash, Pseudonymous ID, Timestamp, Event type, Actor ID |
| **Off-chain Data** | Additional data, Scanning details | Biosecurity, Productivity, Human rights | Planting, Picking, Processing, Packaging, Distribution | ชื่อจริง, ไฟล์ภาพ, เอกสารฉบับเต็ม, Review notes, PII |
| **ข้อจำกัดหลัก** | High cost, RJC membership required, IoT/AI dependency | Patchy internet, Tablet requirement, Buy-in needed, Tag durability | Camera requirement, Certification body, Farmer education, Startup costs, Rural access | Local Simulation (ไม่ใช่ distributed network จริง), ต้องยืนยัน validator, ต้องมี physical-digital link (QR คัดลอกได้) |
| **ขนาดอุตสาหกรรม** | Global (Diamond industry) | Regional (Pacific Islands) | National (Thailand) | Local (จังหวัดบุรีรัมย์ — Pilot) |
| **Target Users** | Diamond businesses, Consumers | Fishermen, Processors, Regulators, Consumers | Farmers, Processors, Retailers, Consumers | ช่างทอ, สหกรณ์, ร้านค้า, ผู้บริโภค |

---

## 2.3 สรุปความต่าง/เหมือนกับผ้าไหมบุรีรัมย์

### ความคล้ายกับกรณีศึกษาอื่น:

1. **Trust Model:** เหมือนกับ Tracr และ TRACETHAI ที่ใช้ Consortium Blockchain เพราะมีหลายองค์กรที่ต้องร่วมมือบันทึกข้อมูล และตรวจสอบ ไม่ให้องค์กรเดียวแก้ได้

2. **Blockchain Type:** เหมือนกับ TRACETHAI ที่ใช้ Private/Consortium Blockchain ที่ควบคุมโดยภาครัฐ ซึ่งเหมาะกับระบบของเราที่ใช้ Consortium Blockchain แต่เป็น Local Simulation

3. **Consensus:** เหมือนกับ WWF Tuna ที่ใช้ Public/Private Blockchain แต่เราใช้ PoA (Proof of Authority) ซึ่เหมาะกับ validator จำนวนน้อยที่รู้ตัวตน

4. **On-chain/Off-chain Separation:** เหมือนกับทุกกรณีศึกษาที่แยกข้อมูลที่จำเป็นต้องบันทึกบน blockchain (certificate code, hash, timestamp) จากข้อมูลที่สามารถแก้ได้ (ชื่อจริง, ไฟล์ภาพ)

### ความต่างจากกรณีศึกษาอื่น:

1. **ขนาด:** ผ้าไหมบุรีรัมย์เป็นระดับ Local/Pilot (จังหวัดบุรีรัมย์) เทียบกับกรณีศึกษาอื่นที่เป็นระดับ National หรือ Global

2. **Technology Stack:** ผ้าไหมบุรีรัมย์ใช้ Local Simulation (SHA-256 + PoA + Ed25519) เทียบกับกรณีศึกษาอื่นที่ใช้ Blockchain จริง (Ethereum, Polygon, ฯลฯ)

3. **Physical-Digital Link:** ผ้าไหมบุรีรัมย์ใช้ QR Code เท่านับกับกรณีศึกษาอื่นที่ใช้ RFID tag หรือ laser inscription

4. **Validator Model:** ผ้าไหมบุรีรัมย์ใช้ 3 Validator Roles จำลอง (สหกรณ์, หน่วยงานตรวจรับรองท้องถิ่, เครือข่ายร้านค้า) เทียบกับกรณีศึกษาอื่นที่ใช้ validator จริงจำนวนมาก

5. **Cost:** ผ้าไหมบุรีรัมย์มีต้นทุนต่ำกว่าเพื่อเป็น Local Simulation เทียบกับกรณีศึกษาอื่นที่ต้องลงทุนสูงใน IoT, AI และ infrastructure

---

## References

Accenture. (2024). Tracr pioneers trust in diamond traceability. สืบค้นจาก https://www.accenture.com/us-en/case-studies/natural-resources/tracr-diamond-traceability

De Beers Group. (2024). Tracr: Diamond Traceability Platform. สืบค้นจาก https://www.debeersgroup.com/about-us/case-studies/2024/tracr

Everledger. (2021). Everledger and Brilliant Earth. สืบค้นจาก https://everledger.io/wp-content/uploads/2021/08/case-study_Everledger-and-Brilliant-Earth.pdf

Office of the Prime Minister's Chief Science Advisor New Zealand. (2021). Case study: Blockchain supply chain traceability project – The future of commercial fishing in Aotearoa New Zealand. สืบค้นจาก https://www.pmcsa.ac.nz/2021/02/21/blockchain-supply-chain-traceability-project/

สำนักงานนโยบายและยุทธศาสตร์การค้า กระทรวงพาณิชย์. (2566). รายงานฉบับ: การประยุกต์ใช้ Blockchain ยกระดับเศรษฐกิจการค้า. สืบค้นจาก https://www.tracethai.com/Final_Report_Phase4_pub.pdf

WWF-New Zealand. (2018). Blockchain Tuna Project 2018. สืบค้นจาก https://wwf.org.nz/news/oceans/blockchain-tuna-project-2018
