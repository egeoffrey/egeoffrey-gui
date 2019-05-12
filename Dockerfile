### MYHOUSE ###

### define base image
ARG MYHOUSE_SDK_VERSION
ARG ARCHITECTURE
FROM myhouseproject/myhouse-sdk-nginx:${ARCHITECTURE}-${MYHOUSE_SDK_VERSION}

### copy files into the image
COPY . $WORKDIR
