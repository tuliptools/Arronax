FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
RUN apt-get update && apt-get install -y libudev-dev libusb-1.0-0
RUN npm install
COPY . .

EXPOSE 8080
CMD ["npm","run","start"]
