#!/bin/bash

###############################################################################
# Quick Deploy Script
# Mục đích: Deploy nhanh từ local machine lên server
# Usage: ./deploy/quick-deploy.sh
###############################################################################

# Configuration
REMOTE_USER="deployer"
REMOTE_HOST="YOUR_DROPLET_IP"  # Thay bằng IP hoặc domain
REMOTE_DIR="/var/www/ptit-chat"
APP_NAME="ptit-chat"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production not found!"
    echo "Please create .env.production with production environment variables"
    exit 1
fi

echo "======================================"
echo "🚀 Quick Deploy - $APP_NAME"
echo "======================================"
echo ""

# Confirm deployment
print_info "Deploy to: $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
read -p "Continue? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

# Step 1: Build locally
print_info "Step 1/4: Building production..."
npm run build || {
    print_error "Build failed!"
    exit 1
}
print_success "Build completed"

# Step 2: Create backup on server
print_info "Step 2/4: Creating backup on server..."
ssh $REMOTE_USER@$REMOTE_HOST "
    if [ -d $REMOTE_DIR/dist ]; then
        sudo cp -r $REMOTE_DIR/dist $REMOTE_DIR/dist.backup.\$(date +%Y%m%d_%H%M%S)
        echo 'Backup created'
    fi
" || print_info "No previous version to backup"

# Step 3: Upload build
print_info "Step 3/4: Uploading files..."
rsync -avz --delete dist/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/dist/ || {
    print_error "Upload failed!"
    exit 1
}
print_success "Upload completed"

# Step 4: Reload server
print_info "Step 4/4: Reloading server..."
ssh $REMOTE_USER@$REMOTE_HOST "
    sudo chown -R www-data:www-data $REMOTE_DIR/dist
    sudo chmod -R 755 $REMOTE_DIR/dist
    sudo nginx -t && sudo systemctl reload nginx
" || {
    print_error "Server reload failed!"
    exit 1
}
print_success "Server reloaded"

echo ""
echo "======================================"
echo "✅ Deployment Successful!"
echo "======================================"
echo ""
echo "🌐 Your site should be live at:"
echo "   http://$REMOTE_HOST"
echo ""
echo "📝 Next steps:"
echo "   - Test the website"
echo "   - Check logs: ssh $REMOTE_USER@$REMOTE_HOST 'sudo tail -f /var/log/nginx/error.log'"
echo ""

