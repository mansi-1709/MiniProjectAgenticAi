# DigitalOcean VPS Deployment Guide

This guide deploys the project on a DigitalOcean Droplet using:
- Ubuntu 22.04 LTS
- Node.js 20
- PM2 (process manager)
- Nginx (reverse proxy + static frontend)
- Certbot (free SSL)

It is tailored to this repository structure:
- `backend/` for API server
- `frontend/` for Vite React app
- Root `.env` used by backend config

## 1. Prerequisites

- A DigitalOcean account
- A domain name (recommended for SSL), for example `pharmacy.yourdomain.com`
- Your project pushed to GitHub
- MongoDB Atlas connection string
- OpenAI API key

## 2. Create DigitalOcean Droplet

1. In DigitalOcean, create a new Droplet.
2. Choose:
- Image: Ubuntu 22.04 LTS
- Plan: Basic (2 GB RAM minimum recommended)
- Authentication: SSH key (recommended) or password
3. Note your server IP address after creation.
4. (Optional but recommended) Point your domain A record to Droplet IP.

## 3. SSH into Server

```bash
ssh root@YOUR_DROPLET_IP
```

If you created a non-root sudo user, use that user for day-to-day operations.

## 4. Initial Server Setup

```bash
apt update && apt upgrade -y
apt install -y git curl ufw nginx
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 5. Install Node.js 20 and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
node -v
npm -v
pm2 -v
```

## 6. Clone Project

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git mini-project
cd mini-project
```

## 7. Install Dependencies

```bash
npm run install-all
```

This installs dependencies in:
- root
- backend
- frontend

## 8. Configure Environment Variables

The backend reads `.env` from the project root.

1. Create root `.env`:

```bash
cp .env.example .env
nano .env
```

2. Set production values:

```env
MONGO_URI=your_mongodb_atlas_connection_string
OPENAI_API_KEY=your_openai_api_key
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://YOUR_DOMAIN
JWT_SECRET=generate_a_long_random_secret
JWT_EXPIRE=7d

# Optional:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
WEBHOOK_URL=
```

Important:
- Use `PORT=5001` to match frontend proxy expectations in this project.
- `FRONTEND_URL` must be your real frontend URL in production.

3. Configure frontend API URL:

```bash
nano frontend/.env
```

Set:

```env
VITE_API_URL=https://YOUR_DOMAIN/api
```

## 9. Build Frontend

```bash
cd /var/www/mini-project/frontend
npm run build
```

This creates `frontend/dist`.

## 10. Start Backend with PM2

```bash
cd /var/www/mini-project/backend
pm2 start src/server.js --name pharmacy-backend
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` (one-time) so PM2 restarts on server reboot.

Check status:

```bash
pm2 status
pm2 logs pharmacy-backend
```

## 11. Configure Nginx

Create Nginx site config:

```bash
nano /etc/nginx/sites-available/pharmacy
```

Paste this (replace `YOUR_DOMAIN`):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    root /var/www/mini-project/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://127.0.0.1:5001/health;
        proxy_set_header Host $host;
    }
}
```

Enable site and test:

```bash
ln -s /etc/nginx/sites-available/pharmacy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 12. Enable HTTPS with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d YOUR_DOMAIN
```

Verify auto-renew:

```bash
systemctl status certbot.timer
```

## 13. Verify Deployment

Check backend health:

```bash
curl http://127.0.0.1:5001/health
curl https://YOUR_DOMAIN/health
```

Open in browser:
- `https://YOUR_DOMAIN`

Expected:
- React frontend loads
- Login/register works
- API calls succeed through `/api`

## 14. Daily Operations

### Pull latest code and redeploy

```bash
cd /var/www/mini-project
git pull
npm run install-all
cd frontend && npm run build
cd ../backend
pm2 restart pharmacy-backend
```

### Useful PM2 commands

```bash
pm2 status
pm2 logs pharmacy-backend
pm2 restart pharmacy-backend
pm2 stop pharmacy-backend
```

### Nginx logs

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 15. Optional Hardening (Recommended)

- Create a non-root sudo user and disable root SSH login.
- Disable password SSH auth after key setup.
- Restrict UFW to only `OpenSSH` and `Nginx Full`.
- Keep system and npm packages updated.
- Rotate API keys and JWT secret periodically.
- Add DigitalOcean backups/snapshots.

## 16. Troubleshooting

### Frontend loads but API fails

- Check `frontend/.env` has:
  - `VITE_API_URL=https://YOUR_DOMAIN/api`
- Rebuild frontend:

```bash
cd /var/www/mini-project/frontend
npm run build
systemctl restart nginx
```

### 502 Bad Gateway

- Backend may be down:

```bash
pm2 status
pm2 logs pharmacy-backend
```

- Verify backend port:

```bash
ss -tulnp | grep 5001
```

### CORS errors

- Ensure root `.env` has:
  - `NODE_ENV=production`
  - `FRONTEND_URL=https://YOUR_DOMAIN`
- Restart backend:

```bash
pm2 restart pharmacy-backend
```

## 17. Quick Copy/Paste Deployment Block

Use this after fresh server setup (edit placeholders first):

```bash
apt update && apt upgrade -y
apt install -y git curl ufw nginx
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git mini-project
cd /var/www/mini-project
npm run install-all
# configure .env and frontend/.env
cd frontend && npm run build
cd ../backend
pm2 start src/server.js --name pharmacy-backend
pm2 save
```

Then finish Nginx + SSL steps above.
