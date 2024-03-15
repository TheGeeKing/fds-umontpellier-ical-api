FROM node:lts-bookworm-slim

WORKDIR /api
COPY . /api
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
