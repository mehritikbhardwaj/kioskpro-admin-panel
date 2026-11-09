# 🚀 KioskPro Admin Panel - Vercel Deployment Guide

Yeh guide follow karke aap KioskPro Admin Web Panel ko **Vercel pe 100% free** host kar sakte hain.

---

## 🌟 Method 1: Deploy via GitHub (Recommended - 2 Minutes)

1. **Step 1: Create a GitHub Repository**
   - GitHub pe ek new private ya public repo banayein: `kioskpro-admin-panel`.
   - Terminal me run karein:
   ```bash
   cd /Users/hritikbhardwaj/Documents/PowerPilot_Rebuild/kioskpro-admin-panel
   git init
   git add .
   git commit -m "Initial commit: KioskPro Admin Web Panel"
   git branch -M main
   git remote add origin https://github.com/<your-username>/kioskpro-admin-panel.git
   git push -u origin main
   ```

2. **Step 2: Import into Vercel**
   - [vercel.com](https://vercel.com) open karein aur login karein.
   - Click **"Add New..."** ➔ **"Project"**.
   - GitHub repository `kioskpro-admin-panel` select karein aur **Import** pe click karein.

3. **Step 3: Environment Variables (Optional)**
   - Vercel me **"Environment Variables"** section open karein:
     - `ADMIN_PASSWORD` = `admin@kioskpro2026` (Aap apna koi bhi manpasand password rakh sakte hain)
     - `ADMIN_SECRET_KEY` = `kioskpro_super_secure_admin_jwt_secret_key_2026`
   - Click **Deploy**!

4. **Result:**
   - Aapko ek live domain mil jayega, jaise:
     `https://kioskpro-admin.vercel.app`

---

## ⚡ Method 2: Deploy via Vercel CLI (Direct from Mac Terminal)

Agar aap direct terminal se deploy karna chahte hain:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
cd /Users/hritikbhardwaj/Documents/PowerPilot_Rebuild/kioskpro-admin-panel
vercel --prod
```

Command complete hone par Vercel production URL screen par show karega!

---

## 🔑 Admin Login Credentials

- **URL:** `https://your-domain.vercel.app/login`
- **Default Master Password:** `admin@kioskpro2026`
*(Aap Vercel Environment Variables me `ADMIN_PASSWORD` change karke ise customize kar sakte hain).*

---

## 📡 Live API Endpoints for SBI KioskPro Desktop App

Desktop app license verification ke liye yeh endpoint call karta hai:

```http
GET https://your-domain.vercel.app/api/license/verify?csp_code=3A450557
```

### Response Example (Active License):
```json
{
  "valid": true,
  "status": "ACTIVE",
  "cspCode": "3A450557",
  "operatorName": "Nagmani Bhardwaj",
  "location": "Patna, Bihar",
  "plan": "12 Months Enterprise (₹1,799)",
  "issuedAt": "2026-11-09T00:00:00.000Z",
  "expiresAt": "2027-11-09T23:59:59.000Z",
  "daysRemaining": 365,
  "announcement": "Welcome to KioskPro Enterprise! High-speed automated SBI Kiosk portal active.",
  "announcementLevel": "info",
  "latestVersion": "2.0.5",
  "minRequiredVersion": "2.0.5",
  "supportContact": "9212716009",
  "distributor": "Hritik Bhardwaj",
  "upiId": "9212716009@yescred"
}
```

### Response Example (Expired / Suspended):
```json
{
  "valid": false,
  "status": "EXPIRED",
  "cspCode": "3A450557",
  "operatorName": "Nagmani Bhardwaj",
  "daysRemaining": 0,
  "message": "Your KioskPro subscription expired. Please scan UPI QR to renew.",
  "supportContact": "9212716009",
  "distributor": "Hritik Bhardwaj",
  "upiId": "9212716009@yescred"
}
```

---

## 🛠 Features Included:
1. **Real-time Kiosk Monitoring:** Total Active, Expired, Expiring Soon (< 7 Days), Total Revenue.
2. **One-Click License Actions:**
   - `+30d` (Quick 1-month extension)
   - `+1y` (Quick 1-year extension)
   - `Block` (Instantly block unpaid client)
   - `Activate` (Instantly unblock)
3. **Remote Announcement Broadcast:**
   - Change global banner alert on all active kiosks anytime without updating the executable.
4. **Distributor Branding:**
   - Verified Publisher: **Hritik Bhardwaj** (9212716009, UPI: `9212716009@yescred`).
