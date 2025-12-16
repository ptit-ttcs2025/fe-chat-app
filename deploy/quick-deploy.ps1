# PowerShell Deploy Script for Windows
# Quick deploy from Windows to Digital Ocean

# Configuration
$REMOTE_USER = "deployer"
$REMOTE_HOST = "YOUR_DROPLET_IP"  # Thay bằng IP hoặc domain
$REMOTE_DIR = "/var/www/ptit-chat"
$APP_NAME = "ptit-chat"

# Colors for output
function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚀 Quick Deploy - $APP_NAME" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Error-Custom ".env.production not found!"
    Write-Host "Please create .env.production with production environment variables"
    exit 1
}

# Confirm deployment
Write-Info "Deploy to: $REMOTE_USER@$REMOTE_HOST`:$REMOTE_DIR"
$response = Read-Host "Continue? (y/n)"
if ($response -ne 'y' -and $response -ne 'Y') {
    Write-Error-Custom "Deployment cancelled"
    exit 1
}

# Step 1: Build locally
Write-Info "Step 1/4: Building production..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Build failed!"
    exit 1
}
Write-Success "Build completed"

# Step 2: Create backup on server
Write-Info "Step 2/4: Creating backup on server..."
$backupScript = @"
if [ -d $REMOTE_DIR/dist ]; then
    sudo cp -r $REMOTE_DIR/dist $REMOTE_DIR/dist.backup.`$(date +%Y%m%d_%H%M%S)
    echo 'Backup created'
fi
"@
ssh "$REMOTE_USER@$REMOTE_HOST" $backupScript

# Step 3: Upload build using SCP
Write-Info "Step 3/4: Uploading files..."

# Create tar file for faster upload
Write-Host "  Creating archive..."
if (Test-Path "deploy-temp.tar.gz") {
    Remove-Item "deploy-temp.tar.gz"
}

# Use tar if available, otherwise use PowerShell compress
if (Get-Command tar -ErrorAction SilentlyContinue) {
    tar -czf deploy-temp.tar.gz -C dist .
} else {
    Compress-Archive -Path "dist\*" -DestinationPath "deploy-temp.zip" -Force
    Move-Item "deploy-temp.zip" "deploy-temp.tar.gz"
}

Write-Host "  Uploading archive..."
scp "deploy-temp.tar.gz" "$REMOTE_USER@$REMOTE_HOST`:/tmp/"
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Upload failed!"
    Remove-Item "deploy-temp.tar.gz" -ErrorAction SilentlyContinue
    exit 1
}

# Extract on server
Write-Host "  Extracting on server..."
$extractScript = @"
sudo mkdir -p $REMOTE_DIR/dist
sudo tar -xzf /tmp/deploy-temp.tar.gz -C $REMOTE_DIR/dist
rm -f /tmp/deploy-temp.tar.gz
"@
ssh "$REMOTE_USER@$REMOTE_HOST" $extractScript

# Cleanup local archive
Remove-Item "deploy-temp.tar.gz" -ErrorAction SilentlyContinue
Write-Success "Upload completed"

# Step 4: Reload server
Write-Info "Step 4/4: Reloading server..."
$reloadScript = @"
sudo chown -R www-data:www-data $REMOTE_DIR/dist
sudo chmod -R 755 $REMOTE_DIR/dist
sudo nginx -t && sudo systemctl reload nginx
cd $REMOTE_DIR
ls -t dist.backup.* 2>/dev/null | tail -n +4 | xargs -r sudo rm -rf
"@
ssh "$REMOTE_USER@$REMOTE_HOST" $reloadScript
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Server reload failed!"
    exit 1
}
Write-Success "Server reloaded"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Successful!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Your site should be live at:"
Write-Host "   http://$REMOTE_HOST" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:"
Write-Host "   - Test the website"
Write-Host "   - Check logs: ssh $REMOTE_USER@$REMOTE_HOST 'sudo tail -f /var/log/nginx/error.log'"
Write-Host ""

