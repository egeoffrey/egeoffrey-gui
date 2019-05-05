FROM nginx:alpine
ENV MYHOUSE_SDK=development
RUN wget https://github.com/myhouse-project/myhouse-sdk/archive/$MYHOUSE_SDK.zip -O myhouse-sdk.zip && unzip myhouse-sdk.zip && mv myhouse-sdk-*/javascript /usr/share/nginx/html/sdk
COPY . /usr/share/nginx/html
