FROM node:11.15.0
# https://stackoverflow.com/questions/32486779/apt-add-repository-command-not-found-error-in-dockerfile
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:jonathonf/ffmpeg-4
RUN apt install -y ffmpeg 
WORKDIR /home/veetaha/my/projects/tac-discord-bot

ENTRYPOINT ["npm", "run", "backend:container:dev"]