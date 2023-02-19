FROM node:19-alpine3.16

WORKDIR /app

COPY package.json ./

RUN npm install

RUN npm install -g typescript
RUN npm install -g ts-node

COPY . ./
RUN npm run build

COPY . .

EXPOSE 8080

CMD ["npm", "start"]