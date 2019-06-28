FROM node:11.15.0
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:jonathonf/ffmpeg-4
RUN apt install -y ffmpeg 

WORKDIR /usr/app

COPY . .

# workaround npm install --prefix warning
RUN npm set unsafe-perm true 

RUN npm install

EXPOSE ${PORT}

ENV NODE_ENV=production

CMD ["npm", "run", "backend:container:start"]