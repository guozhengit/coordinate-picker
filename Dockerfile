# Production Dockerfile for Cloud Deployment
# Uses official Nginx Alpine image for small size

# Build arguments for versioning
ARG BUILD_DATE
ARG VERSION=latest

FROM nginx:1.25-alpine

# Re-declare args after FROM
ARG BUILD_DATE
ARG VERSION

# Add labels with version info
LABEL maintainer="Coordinate Picker" \
      version="${VERSION}" \
      build-date="${BUILD_DATE}" \
      description="Coordinate Picker - PDF and Image Coordinate Tool"

# Install curl for health checks (Alpine uses apk)
RUN apk add --no-cache curl

WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy application files (required)
COPY index.html .
COPY index.js .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

# Nginx image already has the correct CMD, no need to override