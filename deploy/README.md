# 🚀 Deploy Scripts & Configuration

Thư mục này chứa tất cả scripts và config files cần thiết để deploy React app lên Digital Ocean.

## 📁 Nội dung

### 1. `server-setup.sh`
**Mục đích**: Tự động cài đặt và cấu hình server Ubuntu 22.04  
**Chạy trên**: Digital Ocean Droplet (lần đầu tiên)

**Cài đặt:**
- Node.js 20 LTS
- Nginx web server
- PM2 process manager
- Certbot (SSL certificates)
- UFW firewall
- Essential tools

**Usage:**
```bash
# Trên server (sau khi SSH vào)
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deploy/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

### 2. `nginx.conf`
**Mục đích**: Nginx configuration cho React SPA  
**Chạy trên**: Server

**Features:**
- React Router support (SPA routing)
- Gzip compression
- Static asset caching
- Security headers
- API & WebSocket proxy (optional)
- Health check endpoint

**Usage:**
```bash
# Copy to Nginx sites
sudo cp deploy/nginx.conf /etc/nginx/sites-available/ptit-chat
sudo ln -s /etc/nginx/sites-available/ptit-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. `quick-deploy.sh`
**Mục đích**: Deploy nhanh từ local machine  
**Chạy trên**: Local machine (Windows/Mac/Linux)

**Yêu cầu:**
- SSH access to server
- rsync installed

**Usage:**
```bash
# Từ thư mục root của project
chmod +x deploy/quick-deploy.sh
./deploy/quick-deploy.sh
```

### 4. `.github/workflows/deploy.yml`
**Mục đích**: Tự động deploy với GitHub Actions (CI/CD)  
**Trigger**: Push to main/production branch

**Features:**
- Auto build on push
- Deploy to server via SSH
- Create backups
- Health check
- Rollback capability

**Setup:**
1. Vào GitHub repo → Settings → Secrets → Actions
2. Thêm secrets:
   - `DROPLET_IP`: IP của server
   - `DEPLOY_USER`: Username (thường là `deployer`)
   - `SSH_PRIVATE_KEY`: Private SSH key
   - `VITE_API_BASE_URL`: Production API URL
   - `VITE_WS_URL`: Production WebSocket URL

---

## 🎯 Quick Start Guide

### Lần đầu deploy:

1. **Tạo Digital Ocean Droplet**
2. **Setup server:**
   ```bash
   ssh root@YOUR_DROPLET_IP
   wget https://raw.githubusercontent.com/.../deploy/server-setup.sh
   chmod +x server-setup.sh
   sudo ./server-setup.sh
   ```

3. **Deploy code:**
   ```bash
   # Method 1: Manual upload
   ./deploy/quick-deploy.sh
   
   # Method 2: Git clone
   ssh deployer@YOUR_DROPLET_IP
   cd /var/www/ptit-chat
   git clone YOUR_REPO .
   npm ci
   npm run build
   ```

4. **Configure Nginx:**
   ```bash
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/ptit-chat
   sudo ln -s /etc/nginx/sites-available/ptit-chat /etc/nginx/sites-enabled/
   # Edit file và thay domain/IP
   sudo nano /etc/nginx/sites-available/ptit-chat
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Setup SSL (nếu có domain):**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

### Update lần sau:

**Với CI/CD:**
```bash
git push origin main  # Tự động deploy
```

**Thủ công:**
```bash
./deploy/quick-deploy.sh
```

---

## 📋 Checklist trước khi deploy

- [ ] Backend API đã được deploy và test
- [ ] Đã tạo `.env.production` với giá trị chính xác
- [ ] Đã test build locally (`npm run build`)
- [ ] Đã có SSH access to server
- [ ] Đã configure domain DNS (nếu dùng domain)
- [ ] Đã setup firewall rules
- [ ] Đã backup data (nếu có)

---

## 🆘 Troubleshooting

### Build fails locally:
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Cannot connect to server:
```bash
# Check SSH key
ssh -vvv deployer@YOUR_DROPLET_IP

# Check firewall
sudo ufw status
```

### Nginx errors:
```bash
# Check config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### 502 Bad Gateway:
```bash
# Check if backend is running
curl http://localhost:8080/api/v1/health

# Check Nginx proxy config
```

---

## 📞 Support

- Full guide: `DEPLOYMENT_GUIDE.md`
- Nginx docs: https://nginx.org/en/docs/
- Digital Ocean: https://docs.digitalocean.com/

---

**Last updated**: December 2025

