#!/bin/bash

###############################################################################
# Digital Ocean Server Setup Script
# Mục đích: Tự động cài đặt và cấu hình server cho React App
# OS: Ubuntu 22.04 LTS
# Usage: wget https://raw.githubusercontent.com/.../server-setup.sh && chmod +x server-setup.sh && ./server-setup.sh
###############################################################################

set -e  # Exit on error

echo "======================================"
echo "🚀 PTIT Chat - Server Setup Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_info "Starting server setup..."
echo ""

###############################################################################
# 1. System Update
###############################################################################
print_info "Step 1/8: Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"
echo ""

###############################################################################
# 2. Install Essential Tools
###############################################################################
print_info "Step 2/8: Installing essential tools..."
apt install -y curl wget git build-essential software-properties-common
print_success "Essential tools installed"
echo ""

###############################################################################
# 3. Install Node.js 20 LTS
###############################################################################
print_info "Step 3/8: Installing Node.js 20 LTS..."
if command -v node &> /dev/null; then
    print_info "Node.js already installed: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_success "Node.js installed: $(node -v)"
fi
print_success "npm version: $(npm -v)"
echo ""

###############################################################################
# 4. Install Nginx
###############################################################################
print_info "Step 4/8: Installing Nginx..."
if command -v nginx &> /dev/null; then
    print_info "Nginx already installed: $(nginx -v 2>&1)"
else
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_success "Nginx installed and started"
fi
echo ""

###############################################################################
# 5. Install PM2 (Process Manager)
###############################################################################
print_info "Step 5/8: Installing PM2..."
if command -v pm2 &> /dev/null; then
    print_info "PM2 already installed: $(pm2 -v)"
else
    npm install -g pm2
    print_success "PM2 installed: $(pm2 -v)"
fi
echo ""

###############################################################################
# 6. Install Certbot (for SSL)
###############################################################################
print_info "Step 6/8: Installing Certbot..."
if command -v certbot &> /dev/null; then
    print_info "Certbot already installed"
else
    apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
fi
echo ""

###############################################################################
# 7. Setup Firewall (UFW)
###############################################################################
print_info "Step 7/8: Configuring firewall..."
if command -v ufw &> /dev/null; then
    # Allow SSH, HTTP, HTTPS
    ufw --force enable
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw allow 8080/tcp  # Backend API port (if needed)
    print_success "Firewall configured"
    ufw status
else
    print_error "UFW not found, skipping firewall setup"
fi
echo ""

###############################################################################
# 8. Create Deploy User
###############################################################################
print_info "Step 8/8: Creating deploy user..."
if id "deployer" &>/dev/null; then
    print_info "User 'deployer' already exists"
else
    adduser --disabled-password --gecos "" deployer
    usermod -aG sudo deployer

    # Copy SSH keys from root to deployer
    if [ -d /root/.ssh ]; then
        mkdir -p /home/deployer/.ssh
        cp /root/.ssh/authorized_keys /home/deployer/.ssh/ 2>/dev/null || true
        chown -R deployer:deployer /home/deployer/.ssh
        chmod 700 /home/deployer/.ssh
        chmod 600 /home/deployer/.ssh/authorized_keys 2>/dev/null || true
        print_success "SSH keys copied to deployer user"
    fi

    print_success "User 'deployer' created"
fi
echo ""

###############################################################################
# 9. Create Application Directory
###############################################################################
print_info "Creating application directory..."
mkdir -p /var/www/ptit-chat
chown -R deployer:deployer /var/www/ptit-chat
print_success "Directory /var/www/ptit-chat created"
echo ""

###############################################################################
# 10. Setup PM2 Startup
###############################################################################
print_info "Setting up PM2 startup script..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u deployer --hp /home/deployer > /dev/null 2>&1 || true
print_success "PM2 startup configured"
echo ""

###############################################################################
# 11. Install Additional Utilities
###############################################################################
print_info "Installing additional utilities..."
apt install -y htop ncdu tree
print_success "Additional utilities installed"
echo ""

###############################################################################
# Summary
###############################################################################
echo ""
echo "======================================"
echo "✅ Server Setup Complete!"
echo "======================================"
echo ""
echo "📋 Installed Components:"
echo "   - Node.js: $(node -v)"
echo "   - npm: $(npm -v)"
echo "   - Nginx: $(nginx -v 2>&1)"
echo "   - PM2: $(pm2 -v)"
echo "   - Certbot: Installed"
echo "   - Firewall: Configured"
echo ""
echo "👤 Deploy User:"
echo "   - Username: deployer"
echo "   - Home: /home/deployer"
echo "   - App Directory: /var/www/ptit-chat"
echo ""
echo "🔐 Next Steps:"
echo "   1. Switch to deployer user: su - deployer"
echo "   2. Clone your repository to /var/www/ptit-chat"
echo "   3. Setup environment variables (.env.production)"
echo "   4. Build application: npm run build"
echo "   5. Configure Nginx (see DEPLOYMENT_GUIDE.md)"
echo ""
echo "📚 Full Guide: Check DEPLOYMENT_GUIDE.md in your repository"
echo ""
echo "======================================"

# Test Nginx
print_info "Testing Nginx configuration..."
nginx -t && print_success "Nginx configuration is valid" || print_error "Nginx configuration has errors"

echo ""
print_success "Setup script completed successfully! 🎉"
echo ""

