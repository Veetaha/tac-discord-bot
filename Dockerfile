FROM node:14.4.0
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:jonathonf/ffmpeg-4
RUN apt install -y ffmpeg
RUN apt install -y graphicsmagick imagemagick

# node-canvas
RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

WORKDIR /usr/app

COPY . .

# workaround npm install --prefix warning
RUN npm set unsafe-perm true

RUN npm install

ENV NODE_ENV=production

RUN uname -a
RUN node --version
RUN npm --version

CMD ["npm", "run", "backend:container:start"]
