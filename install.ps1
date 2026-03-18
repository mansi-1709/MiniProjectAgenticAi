# AI Pharmacy Management System - Installation Script

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🏥 AI PHARMACY - AUTO INSTALL 🤖      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend installation failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host ""

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Frontend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend installation failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Configure your .env file before running!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Edit .env file with your MongoDB URI and OpenAI API key" -ForegroundColor Gray
Write-Host "2. Run: .\setup-check.ps1 to verify configuration" -ForegroundColor Gray
Write-Host "3. Seed data: cd backend && npm run seed" -ForegroundColor Gray
Write-Host "4. Start backend: cd backend && npm run dev" -ForegroundColor Gray
Write-Host "5. Start frontend: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 See QUICKSTART.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
