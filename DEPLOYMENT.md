# Cloud Deployment Guide

This guide explains how to deploy the Coordinate Picker application to a cloud server.

## Prerequisites

- A cloud server (Alibaba Cloud, Tencent Cloud, AWS, etc.)
- Docker installed on the server
- SSH access to the server
- (Optional) A domain name

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Step 1: Build the Application

```bash
# Build TypeScript
npm run build

# Build Docker image
docker build -t coordinate-picker .
```

#### Step 2: Deploy to Server

**Method A: Using the deployment script**

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to server (replace with your server IP)
./deploy.sh 123.45.67.89 80
```

**Method B: Manual deployment**

```bash
# 1. Save Docker image
docker save coordinate-picker:latest | gzip > coordinate-picker.tar.gz

# 2. Upload to server
scp coordinate-picker.tar.gz root@YOUR_SERVER_IP:/tmp/

# 3. SSH to server
ssh root@YOUR_SERVER_IP

# 4. Load and run on server
cd /tmp
docker load < coordinate-picker.tar.gz
docker run -d \
    --name coordinate-picker \
    --restart unless-stopped \
    -p 80:80 \
    coordinate-picker:latest
```

#### Step 3: Verify Deployment

```bash
# Check container status
docker ps | grep coordinate-picker

# View logs
docker logs -f coordinate-picker

# Test health endpoint
curl http://YOUR_SERVER_IP/health
```

### Option 2: Docker Compose Deployment

```bash
# 1. Upload files to server
scp docker-compose.yaml root@YOUR_SERVER_IP:/opt/coordinate-picker/
scp -r * root@YOUR_SERVER_IP:/opt/coordinate-picker/

# 2. SSH to server and deploy
ssh root@YOUR_SERVER_IP
cd /opt/coordinate-picker
docker-compose up -d

# 3. Check status
docker-compose ps
docker-compose logs -f
```

### Option 3: Static File Deployment (No Docker)

If your server doesn't support Docker:

```bash
# 1. Build the application
npm run build

# 2. Upload files to server
scp index.html index.js index.js.map root@YOUR_SERVER_IP:/var/www/coordinate-picker/

# 3. Configure Nginx on server
ssh root@YOUR_SERVER_IP
```

Create `/etc/nginx/sites-available/coordinate-picker`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or use IP
    
    root /var/www/coordinate-picker;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site and restart Nginx
ln -s /etc/nginx/sites-available/coordinate-picker /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Cloud Provider Specific Instructions

### Alibaba Cloud (阿里云)

1. **Create ECS Instance**
   - OS: Ubuntu 20.04 or CentOS 7+
   - Open ports: 80, 443 (in Security Group)

2. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   systemctl start docker
   systemctl enable docker
   ```

3. **Deploy Application**
   ```bash
   # Use deployment script or manual method above
   ./deploy.sh YOUR_ECS_IP 80
   ```

### Tencent Cloud (腾讯云)

Similar to Alibaba Cloud:
1. Create CVM instance
2. Configure Security Group (allow port 80/443)
3. Install Docker
4. Deploy using the methods above

### AWS EC2

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04
   - Security Group: Allow HTTP (80), HTTPS (443)

2. **Connect and Deploy**
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   
   # Install Docker
   sudo apt update
   sudo apt install docker.io docker-compose -y
   sudo systemctl start docker
   
   # Deploy
   # ... follow deployment steps above
   ```

### DigitalOcean

1. Create Droplet (Ubuntu)
2. Docker is often pre-installed
3. Follow standard deployment steps

## Domain and SSL Configuration

### Configure Domain

1. Point your domain to server IP (A record)
2. Update Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # ... rest of config
}
```

### Add SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
certbot renew --dry-run
```

## Monitoring and Maintenance

### View Logs

```bash
# Docker logs
docker logs -f coordinate-picker

# Nginx logs (if not using Docker)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Update Application

```bash
# 1. Build new version
npm run build
docker build -t coordinate-picker:latest .

# 2. Redeploy
./deploy.sh YOUR_SERVER_IP 80

# Or manually:
docker stop coordinate-picker
docker rm coordinate-picker
# ... run new container
```

### Backup

```bash
# Backup Docker image
docker save coordinate-picker:latest | gzip > backup-$(date +%Y%m%d).tar.gz

# Backup files
tar -czf backup-$(date +%Y%m%d).tar.gz index.html index.js
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs coordinate-picker

# Check if port is in use
netstat -tlnp | grep :80

# Restart Docker
systemctl restart docker
```

### Can't access from browser

1. Check firewall:
   ```bash
   # UFW
   ufw allow 80
   ufw allow 443
   
   # Firewalld
   firewall-cmd --permanent --add-service=http
   firewall-cmd --permanent --add-service=https
   firewall-cmd --reload
   ```

2. Check cloud security group settings

3. Verify Nginx is running:
   ```bash
   docker ps | grep coordinate-picker
   curl localhost:80
   ```

### PDF loading issues

- Ensure CDN (cdnjs.cloudflare.com) is accessible from client browsers
- Check browser console for CORS errors
- Verify Content-Security-Policy headers

## Performance Optimization

### Enable Gzip (already configured in nginx.conf)

### Use CDN

Consider using a CDN like:
- Alibaba Cloud CDN
- Tencent Cloud CDN
- Cloudflare

### Increase Resource Limits

```bash
# In docker-compose.yaml
services:
  mark:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## Security Best Practices

1. **Keep system updated**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Use firewall**
   ```bash
   ufw enable
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ```

3. **Regular backups**
4. **Use HTTPS** (Let's Encrypt)
5. **Monitor logs** for suspicious activity

## Cost Optimization

- Use smallest instance size that meets needs (1 vCPU, 1GB RAM is sufficient)
- Consider spot/preemptible instances for development
- Use object storage for static assets if scaling

## Support

For issues, check:
- Container logs: `docker logs coordinate-picker`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -xe`
