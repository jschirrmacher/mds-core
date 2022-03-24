FROM node:16.14.2-alpine3.15

RUN apk add --no-cache tini rlwrap

RUN mkdir /mds

COPY dist/* /mds/

COPY docker_package.json /mds/package.json

WORKDIR /mds

RUN npm install

ENTRYPOINT ["/sbin/tini", "node", "--require", "dd-trace/init", "--no-deprecation", "server.js"]
