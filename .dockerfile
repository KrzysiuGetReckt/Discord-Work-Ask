FROM node:20-alpine

WORKDIR /discord-work-ask

COPY package*.json ./

RUN npm install --production

COPY . .

CMD ["node", "index.js"]