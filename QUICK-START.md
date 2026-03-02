# 🚀 QuoteMaster Pro - Quick Start Guide

## ⚡ FASTEST WAY TO CREATE .EXE

### Step 1: Open PowerShell as Administrator
- Press `Win + X`
- Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

### Step 2: Navigate to the project folder
```powershell
cd "c:\Users\Anand\Music\quotemaster-pro"
```

### Step 3: Run the build script
```powershell
.\build-exe.ps1
```

That's it! The script will:
1. ✅ Install ps2exe if needed
2. ✅ Build the .exe file
3. ✅ Create `QuoteMaster-Pro-Launcher.exe`

---

## 🎯 USING THE LAUNCHER

### Before Creating .exe (Test First)
Double-click: **`start-app.bat`**

### After Creating .exe
Double-click: **`QuoteMaster-Pro-Launcher.exe`**

---

## 📋 What Happens When You Run It?

1. ✅ Checks if Node.js is installed
2. ✅ Installs backend dependencies (first time only)
3. ✅ Installs frontend dependencies (first time only)
4. ✅ Starts backend server on http://localhost:5000
5. ✅ Starts frontend server on http://localhost:5173

---

## ⚙️ Prerequisites

**You MUST have Node.js installed!**
- Download from: https://nodejs.org/
- Recommended: LTS version

---

## 🐛 Troubleshooting

### "Cannot run scripts" error
Run this in PowerShell (Admin):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Node.js is not installed" error
1. Download Node.js from https://nodejs.org/
2. Install it
3. Restart your computer
4. Run the launcher again

### "Port already in use" error
- Close any other applications using ports 5000 or 5173
- Or restart your computer

### .exe doesn't work
- Make sure the .exe is in the same folder as `backend` and `frontend` directories
- Try running `start-app.bat` instead to see detailed error messages

---

## 📁 File Structure

```
quotemaster-pro/
├── backend/                          # Backend server
├── frontend/                         # Frontend app
├── start-app.ps1                     # PowerShell launcher script
├── start-app.bat                     # Batch launcher (works without .exe)
├── build-exe.ps1                     # Script to create .exe
├── QuoteMaster-Pro-Launcher.exe      # The .exe file (after building)
├── LAUNCHER-README.md                # Detailed documentation
└── QUICK-START.md                    # This file
```

---

## 💡 Tips

- **First run takes longer** - Dependencies need to be installed
- **Subsequent runs are fast** - Dependencies are already installed
- **Keep the .exe in the project root** - It needs access to backend and frontend folders
- **Use Ctrl+C** in the backend window to stop all servers

---

## 🎉 That's All!

You now have a one-click launcher for QuoteMaster Pro!

For more detailed information, see **LAUNCHER-README.md**
