# Gymkak Backend API

Backend API สำหรับโปรเจกต์ Gymkak (Node.js + Express + MongoDB)

## โครงสร้างโฟลเดอร์
```
backend/
  server.js
  .env.example
  src/
    app.js
    config/
      db.js
    controllers/
      exerciseController.js
    models/
      Exercise.js
    routes/
      exerciseRoutes.js
    seed/
      seedExercises.js
```

## ข้อกำหนดเบื้องต้น

### 1. ติดตั้ง MongoDB Community Server
**Windows:**
```powershell
# ดาวน์โหลด MongoDB Community Server
# https://www.mongodb.com/try/download/community
# หรือใช้ winget (ถ้ามี)
winget install MongoDB.Server
```

**หลังติดตั้ง MongoDB:**
```powershell
# เริ่ม MongoDB service
net start MongoDB

# หรือถ้าติดตั้งแบบ manual ใช้
mongod --dbpath "C:\data\db"
```

**ตรวจสอบว่า MongoDB ทำงาน:**
```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

### 2. ติดตั้ง Node.js packages
```bash
npm install
```

### 3. ตั้งค่า Environment
สร้างไฟล์ `.env` (หรือคัดลอกจาก `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/gymkak
MONGODB_DB_NAME=Gym
```

## รันโปรเจกต์

### 1. Seed ข้อมูลเริ่มต้น (ครั้งแรก)
```bash
# Seed ข้อมูล exercises
npm run seed

# Seed ข้อมูล programs (ท่าออกกำลังกายจาก weight/cardio/calisthenics)
npm run seed:programs

# Seed ทั้งหมด
npm run seed:all
```

### 2. รัน Backend Server
```bash
npm run dev
```
หรือ
```bash
npm start
```

Server จะรันที่ `http://localhost:5000`

## ทดสอบ API
```bash
# ดูข้อมูล exercises ทั้งหมด
curl http://localhost:5000/api/exercises

# เพิ่ม exercise ใหม่
curl -X POST http://localhost:5000/api/exercises -H "Content-Type: application/json" -d "{\"name\":\"Deadlift\",\"targetMuscle\":\"Back\",\"equipment\":\"Barbell\",\"level\":\"Advanced\"}"
```

## API Endpoints
- `POST /api/exercises`
- `GET /api/exercises` (รองรับ `name`, `targetMuscle`, `equipment`, `level` เป็น query)
- `GET /api/exercises/:id`
- `PUT /api/exercises/:id`
- `DELETE /api/exercises/:id`

## ตัวอย่าง Query Filter
- `GET /api/exercises?targetMuscle=Chest`
- `GET /api/exercises?level=Beginner`
