FROM node:alpine
WORKDIR /app

# Set the timezone
ENV TZ=Asia/Ho_Chi_Minh

COPY package*.json ./

COPY . .
RUN npm install -g nodemon
RUN npm i --force

EXPOSE 5001
EXPOSE 3001

CMD ["npm", "run", "start", "&", "npm", "run", "authServer"]