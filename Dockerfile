FROM node:14-alpine
LABEL NAME="IDS-SQL-Adapter"
LABEL MAINTAINER Alihan Usta "alihan.usta@x-integrate.com"
LABEL SUMMARY="This image is used to start the IDS-SQL Adapter for OIH"

RUN apk --no-cache add \
    python \
    make \
    g++ \
    libc6-compat

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --production

COPY . /usr/src/app

RUN chown -R node:node .

USER node

ENTRYPOINT ["npm", "start"]
