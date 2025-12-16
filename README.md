# PTIT Chat App - Frontend

Real-time chat application for PTIT students built with React + TypeScript + Redux Toolkit + WebSocket.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Redux Toolkit + RTK Query
- **Real-time**: SockJS + STOMP over WebSocket
- **Styling**: SCSS + CSS Modules
- **Build Tool**: Vite
- **Deployment**: Digital Ocean App Platform

## 📦 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Development with production API
npm run dev:prod
```

### Build & Preview
```bash
# Build for production
npm run build

# Preview production build
npm run preview:prod
```

## 🌐 Deployment

### ⭐ Quick Deploy to Digital Ocean App Platform (Recommended)

**5-minute deployment:**

```bash
# 1. Commit and push
git add .
git commit -m "deploy: ready for production"
git push origin main

# 2. Digital Ocean Dashboard:
# → App Platform → Create App
# → Import GitHub repository
# → Copy content from deploy/app-spec.yaml
# → Paste into App Spec Editor
# → Click "Create Resources"

# 3. Done! ✅
```

### Alternative: Manual Server Deploy

1. **Setup server** (one-time):
   ```bash
   ssh root@YOUR_DROPLET_IP
   wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deploy/server-setup.sh
   chmod +x server-setup.sh && sudo ./server-setup.sh
   ```

2. **Deploy application**:
   ```powershell
   # From local machine (Windows)
   npm run deploy
   ```

### Deploy Scripts

```powershell
# Windows (PowerShell)
npm run deploy

# Linux/Mac (Bash)
npm run deploy:bash
```

## 📁 Project Structure

```
src/
├── apis/                 # API layer (RTK Query)
│   ├── auth/            # Authentication API
│   ├── chat/            # Chat API
│   ├── friend/          # Friend management API
│   └── notification/    # Notification API
├── core/                # Core components from template
│   ├── common/          # Shared components
│   ├── services/        # Core services
│   └── hooks/           # Core hooks
├── feature-module/      # Feature modules
│   ├── auth/            # Authentication features
│   ├── pages/           # Page components
│   └── router/          # Routing configuration
├── hooks/               # Custom React hooks
├── slices/              # Redux slices
├── store/               # Redux store configuration
├── types/               # TypeScript types
└── assets/              # Static assets (images, styles)

deploy/                  # Deployment files
├── server-setup.sh      # Server setup script
├── nginx.conf           # Nginx configuration
├── quick-deploy.sh      # Quick deploy script (Bash)
└── quick-deploy.ps1     # Quick deploy script (PowerShell)
```

## 🔧 Configuration

### Environment Variables

Create `.env.production` from `.env.production.example`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_WS_URL=wss://api.yourdomain.com/api/v1/ws
VITE_IMAGE_URL=/assets/img/
```

See [.env.production.example](./.env.production.example) for all available options.

## 🛠️ Development Scripts

```bash
# Development
npm run dev              # Start dev server (development mode)
npm run dev:prod         # Start dev server (production API)

# Build
npm run build            # Build for production
npm run build:dev        # Build for development

# Preview
npm run preview          # Preview production build
npm run preview:prod     # Preview with production config

# Linting
npm run lint             # Run ESLint

# Deploy
npm run deploy           # Quick deploy (Windows)
npm run deploy:bash      # Quick deploy (Linux/Mac)
```

## 🔒 Security

- JWT-based authentication
- HTTPS/WSS in production
- Security headers configured in Nginx
- Environment variables for sensitive data

## 📊 Performance

- Code splitting with React.lazy
- Image lazy loading
- Virtual scrolling for message lists
- Gzip compression
- Static asset caching

## 📞 Support

- **Issues**: Create an issue in the repository
- **Documentation**: Check the deployment guides
- **Digital Ocean Docs**: https://docs.digitalocean.com/

## 📝 License

This project is for educational purposes (PTIT Chat App).

---

**Built with ❤️ by PTIT Students**

