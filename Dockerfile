@@ -3,7 +3,7 @@ FROM node:20-alpine
 WORKDIR /app
 
 COPY package*.json ./
-RUN npm ci --only=production
+RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
