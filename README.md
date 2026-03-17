# PDF Compress API — Railway + GitHub Deploy Guide

---

## ✅ GitHub এ কী কী ফাইল Upload দিতে হবে

মোট **৪টি ফাইল** — এর বাইরে আর কিছু লাগবে না:

```
pdf-compress-api/          ← এই folder টা GitHub এ যাবে
├── app.js                 ✅ আপলোড করতে হবে
├── package.json           ✅ আপলোড করতে হবে
├── Dockerfile             ✅ আপলোড করতে হবে
└── .gitignore             ✅ আপলোড করতে হবে
```

> ❌ `node_modules/` folder আপলোড করবেন না — Railway নিজেই `npm install` করবে
> ❌ `LinguaPDF_v18_ghostscript.html` GitHub এ দেওয়া লাগবে না — এটা আপনার নিজের কাছে থাকবে
> ❌ `README.md` optional — দিলে ভালো, না দিলেও চলবে

---

## STEP 1 — পিসিতে folder তৈরি করুন

আপনার পিসিতে যেকোনো জায়গায় `pdf-compress-api` নামে একটা folder বানান।

সেই folder এর ভেতরে এই ৪টা ফাইল রাখুন যেগুলো download করেছেন:
- `app.js`
- `package.json`
- `Dockerfile`
- `.gitignore`

---

## STEP 2 — GitHub Repository বানান

1. https://github.com এ যান → **New repository** চাপুন
2. Repository name দিন: `pdf-compress-api`
3. **Public** রাখুন
4. **"Add a README file"** — টিক দেবেন না
5. **Create repository** চাপুন

---

## STEP 3 — Terminal এ ফাইল Push করুন

পিসির Terminal / Command Prompt খুলুন। তারপর একে একে এই command গুলো রান করুন:

```bash
# ১. folder এ ঢুকুন (আপনার folder এর path অনুযায়ী)
cd C:\Users\আপনার-নাম\pdf-compress-api

# ২. git শুরু করুন
git init

# ৩. সব ফাইল add করুন
git add .

# ৪. commit করুন
git commit -m "initial: Ghostscript PDF compress API"

# ৫. main branch set করুন
git branch -M main

# ৬. GitHub repo connect করুন (YOUR_USERNAME বদলান)
git remote add origin https://github.com/YOUR_USERNAME/pdf-compress-api.git

# ৭. push করুন
git push -u origin main
```

> ⚠️ `YOUR_USERNAME` এর জায়গায় আপনার GitHub username বসান
> GitHub password চাইলে Personal Access Token দিন (Settings → Developer settings → Tokens)

Push সফল হলে GitHub এ গিয়ে দেখুন — ৪টা ফাইল দেখাবে ✅

---

## STEP 4 — Railway তে Deploy করুন

1. https://railway.app এ যান
2. **Login with GitHub** দিয়ে login করুন
3. Dashboard এ **New Project** চাপুন
4. **Deploy from GitHub repo** select করুন
5. `pdf-compress-api` repo টা select করুন
6. Railway automatically **Dockerfile** detect করে build শুরু করবে
7. Build শেষ হতে ২-৩ মিনিট লাগবে

---

## STEP 5 — Railway URL নিন

1. Railway project এ **Settings** → **Networking** তে যান
2. **Generate Domain** চাপুন
3. একটা URL পাবেন, যেমন:
   ```
   https://pdf-compress-api-production-xxxx.up.railway.app
   ```
4. এই URL টা **copy করে রাখুন** — পরের ধাপে লাগবে

---

## STEP 6 — HTML ফাইল আপডেট করুন

`LinguaPDF_v18_ghostscript.html` ফাইলটা যেকোনো text editor এ খুলুন (Notepad, VS Code যেকোনোটা)।

**Ctrl+F** দিয়ে এই লেখাটা খুঁজুন:
```
YOUR-RAILWAY-APP
```

এটা পাবেন এই লাইনে:
```javascript
: 'https://YOUR-RAILWAY-APP.up.railway.app';
```

**Railway এর URL দিয়ে replace করুন:**
```javascript
: 'https://pdf-compress-api-production-xxxx.up.railway.app';
```

ফাইল save করুন।

---

## STEP 7 — Test করুন

Browser এ এই URL এ যান:
```
https://আপনার-railway-url.up.railway.app/health
```

এই response আসলে সব ঠিক আছে ✅
```json
{ "status": "ok", "ghostscript": true }
```

তারপর `LinguaPDF_v18_ghostscript.html` browser এ open করুন → **Compress PDF** tool এ যান → একটা PDF upload করুন → কাজ করছে কিনা দেখুন।

---

## Ghostscript Quality Presets

| Mode   | GS Preset  | আনুমানিক DPI | ফাইল কমবে |
|--------|-----------|-------------|----------|
| screen | /screen   | ~72 DPI     | 60–90%   |
| ebook  | /ebook    | ~150 DPI    | 40–75%   |
| print  | /printer  | ~300 DPI    | 20–50%   |
| meta   | /prepress | unchanged   | 1–20%    |

---

## Auto-Deploy (ভবিষ্যতে কোনো update করলে)

```bash
git add .
git commit -m "update: কী পরিবর্তন করলেন"
git push
```
GitHub এ push হলে Railway **স্বয়ংক্রিয়ভাবে** নতুন version deploy করবে ✅

---

## সমস্যা হলে

| সমস্যা | সমাধান |
|--------|--------|
| `Cannot reach compression server` | Railway URL ঠিক আছে কিনা চেক করুন |
| Railway build fail | Dockerfile ঠিকমতো upload হয়েছে কিনা দেখুন |
| `ghostscript: command not found` | Dockerfile এর `apt-get install ghostscript` লাইন আছে কিনা দেখুন |
| CORS error | `app.js` এ `app.use(cors())` আছে — এই সমস্যা হওয়ার কথা না |
| File too large error | `multer` limit 100 MB সেট আছে |
| git push এ authentication error | GitHub Personal Access Token ব্যবহার করুন |
