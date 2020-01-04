FROM node:13.5.0
# https://stackoverflow.com/questions/32486779/apt-add-repository-command-not-found-error-in-dockerfile
# ffmpeg
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:jonathonf/ffmpeg-4
RUN apt install -y ffmpeg
RUN apt install -y graphicsmagick imagemagick

# node-canvas
RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

WORKDIR /home/veetaha/my/projects/tac-discord-bot

ENTRYPOINT ["npm", "run", "backend:container:dev"]
