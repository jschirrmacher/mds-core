FROM node:16.17.1-alpine

RUN apk add --no-cache tini rlwrap

RUN mkdir /mds

COPY docker_package.json /mds/package.json

WORKDIR /mds

RUN npm install

COPY dist/* .

ENTRYPOINT ["/sbin/tini", "node", "--require", "dd-trace/init", "--no-deprecation", "server.js"]
