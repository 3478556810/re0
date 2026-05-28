# ---- Build Stage ----
FROM nginx:alpine

# Copy the static HTML file
COPY index.html /usr/share/nginx/html/index.html

# Create a simple nginx config to proxy API requests to the backend
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location /api/ { \
        proxy_pass http://backend:8080; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    \
    location / { \
        try_files $uri /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
