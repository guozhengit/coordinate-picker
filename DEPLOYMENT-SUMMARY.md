# 云服务器部署总结

## ✅ 已优化的生产环境配置

### 📁 核心文件

| 文件 | 用途 | 说明 |
|------|------|------|
| **Dockerfile** | 生产环境镜像 | Nginx + 健康检查 + 多阶段构建 |
| **docker-compose.yaml** | 本地开发 | 端口 80，基础配置 |
| **docker-compose.prod.yaml** | 生产部署 | 资源限制 + 日志管理 + 健康检查 |
| **nginx.conf** | Nginx配置 | Gzip压缩 + 安全头 + 缓存策略 |
| **deploy-windows.bat** | 部署脚本 | Windows 一键部署到云服务器 |

---

## 🚀 部署方式

### 方式一：自动化部署（推荐）

**Windows 用户:**
```bash
deploy-windows.bat 服务器IP 端口

# 示例
deploy-windows.bat 123.45.67.89 80
```

**脚本会自动完成:**
1. ✅ 编译 TypeScript
2. ✅ 构建 Docker 镜像
3. ✅ 保存并压缩镜像
4. ✅ 上传到云服务器
5. ✅ 在服务器上加载并运行
6. ✅ 清理临时文件

---

### 方式二：Docker Compose 部署

**在云服务器上:**

```bash
# 1. 上传项目文件到服务器
scp -r * root@服务器IP:/opt/coordinate-picker/

# 2. SSH 登录服务器
ssh root@服务器IP

# 3. 进入项目目录
cd /opt/coordinate-picker

# 4. 使用生产配置启动
docker-compose -f docker-compose.prod.yaml up -d --build

# 5. 查看状态
docker-compose -f docker-compose.prod.yaml ps
```

---

### 方式三：纯 Docker 部署

```bash
# 本地构建
docker build -t coordinate-picker:latest .

# 导出镜像
docker save coordinate-picker:latest | gzip > app.tar.gz

# 上传到服务器
scp app.tar.gz root@服务器IP:/tmp/

# 在服务器上运行
ssh root@服务器IP
docker load < /tmp/app.tar.gz
docker run -d \
  --name coordinate-picker \
  --restart always \
  -p 80:80 \
  coordinate-picker:latest
```

---

## 📊 生产环境特性

### ✅ 已配置功能

| 功能 | 配置 | 说明 |
|------|------|------|
| **健康检查** | `/health` 端点 | 每30秒检查一次 |
| **自动重启** | `restart: always` | 容器异常自动重启 |
| **日志管理** | 10MB/文件，保留3个 | 防止日志占满磁盘 |
| **资源限制** | CPU: 1核, 内存: 512MB | 防止资源滥用 |
| **Gzip压缩** | 已启用 | 减少传输数据量 |
| **缓存策略** | 静态资源1年 | 加速访问 |
| **安全头** | X-Frame, XSS保护 | 基础安全防护 |

### 🔧 Nginx 优化

```nginx
# Gzip 压缩
gzip on;
gzip_types text/plain text/css application/javascript application/json;

# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

---

## 🌐 访问和管理

### 访问应用

```
http://服务器IP
http://服务器IP/health  (健康检查)
```

### 管理命令

```bash
# 查看状态
docker ps | grep coordinate-picker

# 查看日志（实时）
docker logs -f coordinate-picker

# 查看日志（最近100行）
docker logs --tail 100 coordinate-picker

# 重启应用
docker restart coordinate-picker

# 停止应用
docker stop coordinate-picker

# 启动应用
docker start coordinate-picker

# 查看资源使用
docker stats coordinate-picker

# 健康检查
curl http://localhost/health
```

---

## 🔍 故障排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker logs coordinate-picker

# 检查镜像是否存在
docker images | grep coordinate-picker

# 重新构建
docker build -t coordinate-picker:latest .
```

### 2. 无法访问应用

```bash
# 检查端口是否开放
netstat -tlnp | grep :80

# 检查防火墙
ufw status
ufw allow 80

# 检查容器网络
docker inspect coordinate-picker | grep IPAddress
```

### 3. 健康检查失败

```bash
# 进入容器检查
docker exec -it coordinate-picker sh

# 手动测试健康端点
curl http://localhost/health

# 查看 Nginx 错误日志
docker exec coordinate-picker cat /var/log/nginx/error.log
```

### 4. 内存不足

```bash
# 查看资源使用
docker stats coordinate-picker

# 调整内存限制（docker-compose.prod.yaml）
deploy:
  resources:
    limits:
      memory: 1G  # 增加到1GB
```

---

## 📋 部署检查清单

### 部署前

- [ ] 已编译 TypeScript (`npm run build`)
- [ ] 已测试应用功能
- [ ] 已配置服务器 SSH 访问
- [ ] 服务器已安装 Docker
- [ ] 服务器端口 80 已开放

### 部署后

- [ ] 应用可以访问 (`http://服务器IP`)
- [ ] 健康检查正常 (`/health` 返回 OK)
- [ ] 日志无错误信息
- [ ] 容器自动重启已启用
- [ ] 文件上传功能正常
- [ ] PDF 显示功能正常

---

## 💡 优化建议

### 性能优化

1. **使用 CDN**
   - 将静态资源上传到阿里云 OSS/腾讯云 COS
   - 配置 CDN 加速

2. **启用 HTTPS**
   ```bash
   # 使用 Let's Encrypt
   apt install certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com
   ```

3. **数据库持久化**（如需要）
   ```yaml
   volumes:
     - ./data:/data
   ```

### 安全优化

1. **限制访问来源**
   ```nginx
   # 仅允许特定IP访问
   allow 1.2.3.4;
   deny all;
   ```

2. **添加基础认证**
   ```nginx
   auth_basic "Restricted";
   auth_basic_user_file /etc/nginx/.htpasswd;
   ```

3. **定期更新镜像**
   ```bash
   docker pull nginx:1.25-alpine
   docker-compose build --pull
   ```

---

## 📈 监控建议

### Docker 原生监控

```bash
# 实时监控
docker stats coordinate-picker

# 查看容器事件
docker events --filter container=coordinate-picker
```

### 第三方监控工具

- **Prometheus + Grafana**: 完整监控方案
- **Portainer**: Docker 可视化管理
- **cAdvisor**: 容器资源监控

---

## 🔄 更新流程

### 快速更新

```bash
# 1. 修改代码
# 2. 编译
npm run build

# 3. 重新部署
deploy-windows.bat 服务器IP 80
```

### 零停机更新

```bash
# 1. 构建新镜像（使用新标签）
docker build -t coordinate-picker:v2 .

# 2. 启动新容器（不同端口）
docker run -d -p 8080:80 --name coordinate-picker-v2 coordinate-picker:v2

# 3. 测试新版本
curl http://localhost:8080

# 4. 切换流量（通过负载均衡器或修改端口）

# 5. 停止旧容器
docker stop coordinate-picker
```

---

## 📞 技术支持

### 日志收集

```bash
# 导出日志
docker logs coordinate-picker > app.log 2>&1

# 导出所有配置
docker inspect coordinate-picker > container-config.json
```

### 备份恢复

```bash
# 备份镜像
docker save coordinate-picker:latest | gzip > backup.tar.gz

# 恢复镜像
docker load < backup.tar.gz
```

---

## ✅ 总结

你的坐标拾取器应用现在已经配置完成，可以部署到生产环境：

- ✅ **生产级 Dockerfile**: 多阶段构建，健康检查
- ✅ **优化的 Nginx 配置**: Gzip，缓存，安全头
- ✅ **自动化部署脚本**: 一键部署到云服务器
- ✅ **完整的日志管理**: 自动轮转，防止磁盘占满
- ✅ **资源限制**: 防止单个容器占用过多资源
- ✅ **自动重启**: 容器异常自动恢复

**立即部署:**
```bash
deploy-windows.bat 你的服务器IP 80
```

祝部署顺利！🎉
