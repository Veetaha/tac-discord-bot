FROM node:11.15.0
WORKDIR /home/veetaha/my/projects/tac-discord-bot

EXPOSE ${PORT}

CMD ["npm", "run", "backend:container:dev"]