FROM mcr.microsoft.com/oss/nginx/nginx:1.15.5-alpine

WORKDIR /etc/nginx/

COPY nginx.conf .
COPY ssl.key .
COPY ssl.crt .

EXPOSE 443
