# CLAUDE.md — gateway_temp

## โปรเจกต์นี้คืออะไร

**Gateway Temperature** — Desktop app สำหรับทดสอบ QC เตารีด ใช้ Electron + Next.js วัดอุณหภูมิแบบ realtime ผ่าน Serial Port (Arduino) แล้วบันทึกผลลงฐานข้อมูลผ่าน REST API

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 37 + Electron Forge |
| Frontend | Next.js 15 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS 4 |
| UI | React Select, Recharts, react-gauge-chart, SweetAlert2 |
| Hardware | serialport 13 (Serial COM → Arduino) |
| HTTP | Axios |
| Utilities | moment, xlsx (Excel export) |

---

## โครงสร้าง Directory

```
gateway_temp/
├── electron/
│   ├── main.ts          # Electron main process — IPC handlers, serial port, file I/O
│   └── preload.ts       # Context bridge — expose window.electronAPI
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── login/       # หน้า login
│   │   ├── temp/        # ทดสอบอุณหภูมิ (หน้าหลัก)
│   │   ├── inspection/  # QC inspection — list, detail, testing
│   │   ├── setting/     # ตั้งค่า API endpoint และ COM port
│   │   └── calibration-test/ # คาลิเบรทเซนเซอร์
│   ├── components/
│   │   ├── temperature/ # Components เฉพาะหน้า temp
│   │   │   ├── chartTemp.tsx          # กราฟอุณหภูมิ realtime
│   │   │   ├── ambientchart1.tsx      # กราฟอุณหภูมิรอบข้าง
│   │   │   ├── testHistory.tsx        # ประวัติผลทดสอบ
│   │   │   ├── serialCommunicationPort.tsx  # เลือก COM port
│   │   │   ├── carlibrateFile.tsx     # จัดการไฟล์ calibration
│   │   │   └── apiSetting.tsx         # ตั้งค่า API URL
│   │   ├── sidebar.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── pagination.tsx
│   │   ├── translator.tsx  # TH/EN translations
│   │   └── routing.tsx     # Route guards
│   ├── lib/auth/
│   │   ├── auth.tsx        # signIn/signOut API calls
│   │   └── authProvider.tsx # React Context + useAuth() hook
│   ├── utils/
│   │   └── localstorage.ts
│   └── types/
│       └── global.d.ts     # Type definitions สำหรับ window.electronAPI
├── data/                   # ไฟล์ calibration ที่ upload ไว้
├── config.cnf              # API URL + COM port (auto-created ถ้าไม่มี)
├── forge.config.js         # Electron Forge packaging config
├── tsconfig.json           # Next.js TypeScript config
└── tsconfig.electron.json  # Electron main process TypeScript config
```

---

## Scripts

```bash
npm run e              # Dev mode: Next.js + Electron พร้อมกัน (ใช้บ่อยสุด)
npm run dev            # Next.js dev server อย่างเดียว (port 3000)
npm run build:electron # Compile Electron main.ts → electron/dist/main.js
npm run make           # Package เป็น installer (Windows/macOS/Linux)
npm run lint           # ESLint
```

**ห้าม start/stop services** — User จัดการ Electron app เอง

---

## Configuration

ไม่มี `.env` — config อยู่ใน `config.cnf` (root directory):

```
API=https://tjsupply-core-api-production-2bc8.up.railway.app/api/v1/
TemperatureCOM=
```

อ่าน/เขียน config ผ่าน IPC เท่านั้น:
```ts
window.electronAPI.getAPIPath()   // อ่าน API URL
window.electronAPI.setAPIPath()   // เขียน API URL
window.electronAPI.getPort()      // อ่าน COM port
```

---

## Electron IPC Bridge

**ทุก operation ที่ต้องใช้ native API ต้องผ่าน `window.electronAPI`** — ห้าม fetch ตรงจาก renderer

```ts
// HTTP requests (ผ่าน main process)
window.electronAPI.fetchAPI({ method, URL, body })

// Serial port
window.electronAPI.openPort(portNumber)
window.electronAPI.writeData({ port, command })
window.electronAPI.closePort()
window.electronAPI.onSerialData(callback)   // listener realtime

// File
window.electronAPI.loadImg(filename)        // โหลดรูปเป็น base64
window.electronAPI.uploadCalibrate(...)     // upload ไฟล์ calibration
window.electronAPI.deleteCalibrate(filename)

// Config
window.electronAPI.getAPIPath()
window.electronAPI.setAPIPath(url)
window.electronAPI.getPort()
```

---

## Data Flow หลัก

```
Arduino (Serial 115200 baud)
  → Electron main.ts (serialport listener)
  → IPC → window.electronAPI.onSerialData()
  → handleSerialData() ใน React
  → setState (temp1-4, ambient1-4, current, time, status)
  → UI update realtime

เมื่อ Passed/Failed:
  → recordData()
  → POST qc/record (สร้าง record)
  → POST qc/status (บันทึกผล)
```

---

## Serial Data Format (จาก Arduino)

```
parts[0-3]   = อุณหภูมิ (ขวา, กลาง, ซ้าย, บน) °C
parts[4-7]   = อุณหภูมิรอบข้าง ambient 1-4 °C
parts[9]     = เวลา (วินาที)
parts[10]    = กระแสไฟฟ้า (แอมแปร์)
parts[11]    = status ("on", "Passed", "Failed", "stop")
parts[12]    = detail code ("666", "777", "888", "010"-"013", "020"-"040")
```

---

## Backend API

Base URL: ตั้งใน `config.cnf` (ค่า default: Railway production)

| Endpoint | วัตถุประสงค์ |
|----------|-------------|
| `POST user/auth` | Login |
| `POST user/logout` | Logout |
| `GET qc/project/extend` | ดึง QC project list |
| `GET qc/itemProject/:id` | ดึง QC items ของ project |
| `POST qc/record` | สร้าง test record |
| `POST qc/status` | บันทึกผลทดสอบ |
| `GET qc/status/history` | ดึงประวัติผล |
| `GET inspection/*` | Inspection module |
| `POST construct/encrypt` | แปลง encrypted QR → serial number |

---

## Auth Pattern

```ts
const auth = useAuth(); // จาก authProvider.tsx
auth.user.data.ID       // User ID
auth.user.data.token    // JWT token (ส่งใน Authorization header ผ่าน main process)
```

Token เก็บใน localStorage ผ่าน `localStorageWeb` utility

---

## Patterns ที่ใช้ใน Codebase

- **ทุก page เป็น `"use client"`** เพราะเป็น Electron app ใช้ browser APIs ทั้งหมด
- **`useRef` สำหรับ closure trap** — ตัวแปรที่ต้องใช้ใน serial data listener ต้องทำเป็น ref ก่อน (เช่น `serialNumberRef`, `qcProjectRef`)
- **`recordedRef`** — guard ป้องกัน record ซ้ำเมื่อ Passed/Failed
- **SweetAlert2** — ใช้แทน `alert()` ทุกที่ สำหรับ error/confirm dialogs
- **ไม่มี React Query** — ใช้ `useEffect` + `window.electronAPI.fetchAPI` โดยตรง

---

## กฎเฉพาะโปรเจกต์

1. **ห้าม fetch ตรงจาก renderer** — ทุก HTTP ต้องผ่าน `window.electronAPI.fetchAPI`
2. **ห้าม import serialport ใน renderer** — ใช้ได้เฉพาะ Electron main process
3. **Comment ภาษาไทย** ตาม global CLAUDE.md
4. **ไม่มี `.env`** — config ทำผ่าน `config.cnf` + IPC เท่านั้น
5. **หน้า `temp/page.tsx`** คือหน้าทดสอบอุณหภูมิหลัก — ระวัง serial listener cleanup (บรรทัด 526-535 ปัจจุบัน comment cleanup ไว้ ยังไม่ได้แก้)
