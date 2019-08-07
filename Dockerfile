### EGEOFFREY ###

### define base image
ARG SDK_VERSION
ARG ARCHITECTURE
FROM egeoffrey/egeoffrey-sdk-alpine:${SDK_VERSION}-${ARCHITECTURE}

### install dependencies
RUN apk update && apk add nginx && rm -rf /var/cache/apk/* && mkdir -p /run/nginx

### copy files into the image
COPY . $WORKDIR
