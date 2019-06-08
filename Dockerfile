### MYHOUSE ###

### define base image
ARG SDK_VERSION
ARG ARCHITECTURE
FROM myhouseproject/myhouse-sdk-alpine:${ARCHITECTURE}-${SDK_VERSION}

### install dependencies
RUN apk update && apk add nginx && rm -rf /var/cache/apk/* && mkdir -p /run/nginx

### copy files into the image
COPY . $WORKDIR
