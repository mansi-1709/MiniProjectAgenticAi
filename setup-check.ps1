# ===============================================
# AI PHARMACY MANAGEMENT SYSTEM - SETUP SCRIPT
# ===============================================
# 
# This script will help you verify your setup
# Run this after configuring .env file
#

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🏥 AI PHARMACY SETUP VERIFICATION 🤖    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
Write-Host "📋 Checking configuration..." -ForegroundColor Yellow
if (Test-Path ".\.env") {
    Write-Host "   ✅ .env file found" -ForegroundColor Green
} else {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please copy .env.example to .env and configure it" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
Write-Host ""
Write-Host "🔍 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js installed: $nodeVersion" -ForegroundColor Green
    
    # Check if version is 18+
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "   ⚠️  Warning: Node.js 18+ recommended (you have v$versionNumber)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Read .env file
Write-Host ""
Write-Host "🔐 Checking environment variables..." -ForegroundColor Yellow
$envContent = Get-Content ".\.env" -Raw

# Check MONGO_URI
if ($envContent -match "MONGO_URI=mongodb\+srv://") {
    Write-Host "   ✅ MongoDB URI configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ MongoDB URI not configured!" -ForegroundColor Red
    Write-Host "   See MONGODB_SETUP.md for help" -ForegroundColor Yellow
}

# Check OPENAI_API_KEY
if ($envContent -match "OPENAI_API_KEY=sk-") {
    Write-Host "   ✅ OpenAI API Key configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ OpenAI API Key not configured!" -ForegroundColor Red
    Write-Host "   See OPENAI_SETUP.md for help" -ForegroundColor Yellow
}

# Check if backend dependencies are installed
Write-Host ""
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path ".\backend\node_modules") {
    Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd backend && npm install" -ForegroundColor Cyan
}

if (Test-Path ".\frontend\node_modules") {
    Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Run: cd frontend && npm install" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📚 NEXT STEPS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Install dependencies:" -ForegroundColor White
Write-Host "   cd backend && npm install" -ForegroundColor Gray
Write-Host "   cd ..\frontend && npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Seed sample data (optional):" -ForegroundColor White
Write-Host "   cd backend && npm run seed" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start backend (Terminal 1):" -ForegroundColor White
Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start frontend (Terminal 2):" -ForegroundColor White
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Open browser:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For detailed setup, see QUICKSTART.md" -ForegroundColor Yellow
Write-Host ""
