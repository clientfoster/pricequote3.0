# QuoteMaster Pro - Auto Launcher

This package contains scripts to automatically install dependencies and start both frontend and backend servers for QuoteMaster Pro.

## 📦 What's Included

- `start-app.ps1` - PowerShell script that handles all the automation
- `start-app.bat` - Batch file launcher (can be used directly)
- This README with instructions to create an .exe file

## 🚀 Quick Start (Without .exe)

### Option 1: Double-click the Batch File
Simply double-click `start-app.bat` to run the application.

### Option 2: Run PowerShell Script
Right-click `start-app.ps1` and select "Run with PowerShell"

## 🔧 Creating an .exe File

To create a standalone .exe file, follow these steps:

### Method 1: Using PS2EXE (Recommended)

1. **Install PS2EXE**
   Open PowerShell as Administrator and run:
   ```powershell
   Install-Module -Name ps2exe -Scope CurrentUser
   ```

2. **Navigate to the project directory**
   ```powershell
   cd "c:\Users\Anand\Music\quotemaster-pro"
   ```

3. **Convert to .exe**
   ```powershell
   Invoke-ps2exe -inputFile ".\start-app.ps1" -outputFile ".\QuoteMaster-Pro-Launcher.exe" -title "QuoteMaster Pro Launcher" -description "Auto installer and server launcher for QuoteMaster Pro" -company "QuoteMaster Pro" -version "1.0.0.0" -iconFile ".\icon.ico" -requireAdmin
   ```

   **Note:** If you don't have an icon file, remove the `-iconFile ".\icon.ico"` parameter:
   ```powershell
   Invoke-ps2exe -inputFile ".\start-app.ps1" -outputFile ".\QuoteMaster-Pro-Launcher.exe" -title "QuoteMaster Pro Launcher" -description "Auto installer and server launcher for QuoteMaster Pro" -company "QuoteMaster Pro" -version "1.0.0.0" -requireAdmin
   ```

4. **Run the .exe**
   Double-click `QuoteMaster-Pro-Launcher.exe` to launch the application!

### Method 2: Using Bat to Exe Converter (GUI Tool)

1. **Download Bat to Exe Converter**
   - Visit: https://bat-to-exe-converter-x64.en.softonic.com/
   - Or search for "Bat to Exe Converter" and download from a trusted source

2. **Open the tool and configure:**
   - Select `start-app.bat` as the input file
   - Choose output location and name (e.g., `QuoteMaster-Pro-Launcher.exe`)
   - Optionally add an icon
   - Click "Compile"

3. **Run the .exe**
   Double-click the generated .exe file!

### Method 3: Using IExpress (Built into Windows)

1. **Open IExpress**
   - Press `Win + R`
   - Type `iexpress` and press Enter

2. **Follow the wizard:**
   - Select "Create new Self Extraction Directive file"
   - Choose "Extract files and run an installation command"
   - Package title: "QuoteMaster Pro Launcher"
   - No prompt
   - Do not display license
   - Add files: Select `start-app.bat` and `start-app.ps1`
   - Install Program: `start-app.bat`
   - Show window: Default
   - Finished message: "QuoteMaster Pro is starting..."
   - Browse and select output .exe location
   - No restart
   - Save SED: Optional
   - Create package

3. **Run the .exe**
   Double-click the generated .exe file!

## 📋 What the Launcher Does

1. ✅ Checks if Node.js and npm are installed
2. ✅ Displays current Node.js and npm versions
3. ✅ Installs backend dependencies (if not already installed)
4. ✅ Installs frontend dependencies (if not already installed)
5. ✅ Starts the backend server (http://localhost:5000)
6. ✅ Starts the frontend server (http://localhost:5173)
7. ✅ Opens both servers in separate windows

## ⚙️ Prerequisites

- **Node.js** (v14 or higher) - Download from https://nodejs.org/
- **npm** (comes with Node.js)

## 🎯 Usage

1. Run the launcher (batch file, PowerShell script, or .exe)
2. Wait for dependencies to install (first run only)
3. Both servers will start automatically
4. Backend runs on: http://localhost:5000
5. Frontend runs on: http://localhost:5173
6. Press `Ctrl+C` in the backend window to stop all servers

## 🐛 Troubleshooting

### "PowerShell execution policy" error
If you get an execution policy error, run this in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Node.js is not installed" error
Download and install Node.js from https://nodejs.org/

### Ports already in use
If ports 5000 or 5173 are already in use:
- Close other applications using these ports
- Or modify the port settings in the respective package.json files

### .exe doesn't run
- Make sure you're running it from the project root directory
- The .exe needs to be in the same folder as the `backend` and `frontend` directories

## 📝 Notes

- The launcher automatically detects if dependencies are already installed
- On first run, installation may take a few minutes
- Subsequent runs will be much faster
- The .exe file must remain in the project root directory (same level as backend and frontend folders)

## 🔒 Security Note

When creating an .exe from PowerShell scripts, some antivirus software may flag it as suspicious. This is a false positive. You can:
- Add an exception in your antivirus software
- Use the batch file directly instead
- Build the .exe on your own machine using the methods above

## 📞 Support

If you encounter any issues, please check:
1. Node.js and npm are properly installed
2. You're running the launcher from the correct directory
3. No other applications are using ports 5000 or 5173

---

**Enjoy using QuoteMaster Pro! 🚀**
