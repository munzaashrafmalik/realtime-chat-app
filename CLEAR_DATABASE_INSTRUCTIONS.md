# Database Clear Karne ke Instructions

## Method 1: MongoDB Atlas Dashboard (Recommended - Sabse Easy)

1. MongoDB Atlas login karein: https://cloud.mongodb.com/
2. Apna cluster select karein
3. "Browse Collections" button click karein
4. Har collection clear karein:
   - **users** collection → "..." → "Delete All Documents" → Confirm
   - **messages** collection → "..." → "Delete All Documents" → Confirm
   - **groups** collection → "..." → "Delete All Documents" → Confirm
   - **calls** collection → "..." → "Delete All Documents" → Confirm

✅ **Done!** Database completely fresh ho gaya.

---

## Method 2: Local Script (IP Whitelist Required)

### Step 1: IP Whitelist karein
1. MongoDB Atlas dashboard mein jayein
2. "Network Access" section mein jayein
3. "Add IP Address" click karein
4. "Add Current IP Address" select karein
5. Save karein

### Step 2: Script run karein
Terminal mein yeh command run karein:

```bash
cd backend
node scripts/clearDatabase.js
```

Script output:
```
✅ Database cleared successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Users deleted: X
💬 Messages deleted: X
👨‍👩‍👧‍👦 Groups deleted: X
📞 Calls deleted: X
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Your database is now completely fresh!
```

---

## Method 3: Railway API Endpoint (Jab deploy ho jaye)

Railway properly deploy hone ke baad, browser mein yeh page open karein:
```
https://realtime-chat-app-production-81db.up.railway.app/clear-database.html
```

"Clear All Data" button click karein aur confirm karein.

---

## Verification

Database clear hone ke baad verify karein:
1. App open karein: https://realtime-chat-app-munza-ashrafs-projects.vercel.app/
2. Purane credentials se login try karein
3. Login fail hoga = Database successfully cleared! ✅
4. Ab naye accounts bana kar fresh testing start karein

---

## Notes
- **Recommendation**: Method 1 (MongoDB Atlas Dashboard) sabse easy aur fast hai
- Railway deployment issues ki wajah se API endpoint abhi kaam nahi kar raha
- Local script ke liye pehle IP whitelist karna zaroori hai
