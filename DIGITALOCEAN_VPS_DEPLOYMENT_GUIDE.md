# DigitalOcean VPS Deployment Guide

This guide deploys the project on a DigitalOcean Droplet using:
- Ubuntu 22.04 LTS
- Node.js 20
- PM2 (process manager)
- Nginx (reverse proxy + static frontend)
- HTTP on VPS IP (domain/SSL optional later)

It is tailored to this repository structure:
- `backend/` for API server
- `frontend/` for Vite React app
- Root `.env` used by backend config

Current deployment target in this guide:
- VPS IP: `143.244.128.93`
- Access URL: `http://143.244.128.93`

## 1. Prerequisites

- A DigitalOcean account
- Your project pushed to GitHub
- MongoDB Atlas connection string
- OpenAI API key

Optional:
- A domain name (needed if you want HTTPS via Let's Encrypt)

## 2. Create DigitalOcean Droplet

1. In DigitalOcean, create a new Droplet.
2. Choose:
- Image: Ubuntu 22.04 LTS
- Plan: Basic (2 GB RAM minimum recommended)
- Authentication: SSH key (recommended) or password
3. Note your server IP address after creation.
4. Optional: If you buy a domain later, point its A record to Droplet IP.

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
FRONTEND_URL=http://143.244.128.93
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
- `FRONTEND_URL` should be `http://143.244.128.93` for your current setup.

3. Configure frontend API URL:

```bash
nano frontend/.env
```

Set:

```env
VITE_API_URL=/api
```

Why this is better:
- Frontend and API share the same origin through Nginx.
- No hardcoded IP in built assets.
- Fewer CORS and timeout issues in production.

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

Paste this:

```nginx
server {
    listen 80;
  server_name 143.244.128.93 _;

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

For your current setup (IP only), skip this step.
Let's Encrypt certificates require a domain name and do not issue certificates for bare public IPs.

When you get a domain later, update Nginx `server_name` and run:

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
curl http://143.244.128.93/health
```

Open in browser:
- `http://143.244.128.93`

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
  - `VITE_API_URL=/api`
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
  - `FRONTEND_URL=http://143.244.128.93`
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

Then finish Nginx steps above. Skip SSL unless you later connect a domain.

If you are deploying with IP only, finish Nginx and skip SSL step for now.

## 18. Switch From IP To Domain (After Purchase)

Use this section now that you have a domain.

### 1) Point DNS to your Droplet

In your domain DNS panel, create/update these records:
- Type: `A`
- Host/Name: `@`
- Value: `143.244.128.93`
- TTL: `300` (or default)

Optional (for `www`):
- Type: `A`
- Host/Name: `www`
- Value: `143.244.128.93`

Wait for propagation (usually a few minutes, can take longer).

### 2) Update backend env

```bash
cd /var/www/mini-project
nano .env
```

Set:

```env
NODE_ENV=production
FRONTEND_URL=https://pharmabooks.app
PORT=5001
```

### 3) Update frontend env

```bash
cd /var/www/mini-project/frontend
nano .env
```

Set:

```env
VITE_API_URL=/api
```

### 4) Update Nginx server_name

```bash
sudo nano /etc/nginx/sites-available/pharmacy
```

Set your server block to:

```nginx
server {
  listen 80;
  server_name pharmabooks.app www.pharmabooks.app;

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

### 5) Rebuild frontend and restart services

```bash
cd /var/www/mini-project/frontend
npm run build
cd ../backend
pm2 restart pharmacy-backend
sudo nginx -t
sudo systemctl reload nginx
```

### 6) Enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pharmabooks.app -d www.pharmabooks.app
```

Choose redirect to HTTPS when prompted.

### 7) Verify

```bash
curl -I http://pharmabooks.app
curl -I https://pharmabooks.app
curl https://pharmabooks.app/health
```

Open in browser:
- `https://pharmabooks.app`

### 8) If domain not opening

- Check DNS resolves to your VPS:
```bash
nslookup pharmabooks.app
```
- Check firewall:
```bash
sudo ufw status
```
- Check Nginx and PM2:
```bash
sudo nginx -t
pm2 status
pm2 logs pharmacy-backend --lines 100
```
