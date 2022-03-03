FROM node:16.11.1-alpine

RUN apk add --no-cache tini

RUN mkdir /mds

COPY dist/* /mds/

COPY docker_package.json /mds/package.json

WORKDIR /mds

RUN npm install

ENTRYPOINT ["/sbin/tini", "node", "--require", "dd-trace/init", "--no-deprecation", "--experimental-repl-await", "server.js"]
