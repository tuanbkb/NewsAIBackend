FROM node:24

WORKDIR /app

RUN apt-get update && apt-get install -y curl zstd

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

COPY package.json package-lock.json* ./
RUN npm install

RUN npx playwright install --with-deps

COPY . .
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 5104 11434

CMD ["/app/entrypoint.sh"]