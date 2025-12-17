# Production Dockerfile for Cloud Deployment
# Uses Node.js to avoid registry issues

FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx curl

# Create nginx directories
RUN mkdir -p /run/nginx /usr/share/nginx/html

WORKDIR /usr/share/nginx/html

# Copy application files (required)
COPY index.html .
COPY index.js .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]