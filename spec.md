# QC Status Logic Specification (Inspection Detail)

เอกสารสรุป Logic การคำนวณสถานะและการแสดงผลในหน้ารายละเอียดการตรวจสอบ (Inspection Detail) เพื่อใช้เป็นมาตรฐานอ้างอิง

## 1. Badge Status Logic (สถานะภาพรวม)
การแสดง Badge (ผ่าน / ไม่ผ่าน / รอการตรวจสอบ) ใช้ Logic แบบ **Hybrid** เพื่อความรวดเร็วและแม่นยำ:

- 🔴 **ไม่ผ่าน (Failed):** แสดงทันทีหากพบว่ามี Test ใดก็ตาม (Seaward หรือ Thermostat) ใน Session นั้นมีสถานะเป็น `"Failed"` โดยไม่ต้องรอทดสอบครบทุกรายการ
- 🟢 **ผ่าน (Passed):** แสดงเฉพาะเมื่อ Database (`statusOverView`) ส่งค่ามาเป็น `"Passed"` เท่านั้น (ซึ่งหมายความว่าทดสอบครบถ้วนตามเงื่อนไขโปรเจกต์และผ่านทั้งหมดแล้ว)
- 🟡 **รอการตรวจสอบ (In Progress):** แสดงในกรณีอื่นๆ (ยังทดสอบไม่ครบ และยังไม่มีอันไหนที่ตก)

## 2. Real-time Result Fetching (การดึงข้อมูลผลการทดสอบ)
- **Graceful Degradation:** หาก API (`qc/status/type`) ขัดข้องหรือไม่มีข้อมูล ระบบจะใช้ `defaultFailedReason` เพื่อป้องกัน UI Crash
- **Failed Priority Display:** ในส่วนของ "ค่าที่กำหนด (ซีเวิร์ด)" ระบบจะฉลาดพอที่จะเลือกดึง Script และผลลัพธ์ของ **รายการที่ตก (Failed Item)** มาแสดงก่อน เพื่อให้ผู้ใช้เห็นทันทีว่าตกที่ค่าไหน (ถ้าไม่มีรายการตก จะแสดงรายการแรกที่เจอเป็นปกติ)

## 3. Pending Tests Visibility (การแสดงรายการที่ค้าง)
- **Endpoint:** `qc/record/remainingQc/:qcRecordID`
- **UI Element:** เพิ่มกล่องสีเหลือง **"⏳ รอการทดสอบ"**
- **Condition:** จะแสดงเฉพาะเมื่อสถานะเป็น `"In progress"` เท่านั้น เพื่อให้ผู้ใช้ทราบว่าใน Session นี้ยังขาดการทดสอบหัวข้อใดบ้างก่อนที่จะผ่าน

## 4. API & Technical Fixes
- **Correct Endpoint:** แก้ไขจาก `remaining` เป็น `remainingQc` ตามมาตรฐานของ API Core
- **Data Synchronization:** ใช้ `Promise.all` ในการดึงข้อมูล `failedReason` และ `remainingTests` พร้อมกันเพื่อ Performance ที่ดีขึ้น

---
*หมายเหตุ: หากต้องการเปลี่ยนแปลงเงื่อนไขการให้ "ผ่าน" (เช่น ให้ผ่านทันทีที่ทดสอบอันแรกผ่าน) ต้องมาปรับที่ส่วน Badge Logic ในไฟล์ `page.tsx`*
