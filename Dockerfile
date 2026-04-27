FROM node:24

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5104

CMD ["npm", "run", "prod"]