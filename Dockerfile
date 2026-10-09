FROM node:20-alpine
# poppler-utils: pdfimages (images inside PDFs). chromium: PDF output of summaries.
RUN apk add --no-cache poppler-utils chromium
WORKDIR /app
ENV NODE_ENV=production BOT_MODE=polling DATA_DIR=/data PORT=8080 \
    PDFIMAGES_BIN=pdfimages CHROME_PATH=/usr/bin/chromium-browser
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
COPY assets ./assets
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "src/index.js"]
