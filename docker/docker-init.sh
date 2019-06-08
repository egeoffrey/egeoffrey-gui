#!/bin/sh

echo "Starting webserver..."
cp docker/default.conf /etc/nginx/conf.d
nginx -c /etc/nginx/nginx.conf
