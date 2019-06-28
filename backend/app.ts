import '@app/polyfills';
import Discord from 'discord.js';
import Container from 'typedi';

import { ConfigService  } from '@services/config.service';
import { LoggingService } from '@services/logging.service';
import { DiscordCmdHandlerBuilder } from '@modules/discord/discord-cmd-handler-builder.class';
import { TacCmdHandlingService } from '@services/tac-cmd-handling.service';
import { TacMusicCmdHandlingService } from '@services/tac-music-cmd-handling.service';

const config = Container.get(ConfigService);
const log    = Container.get(LoggingService);

new Discord.Client()
    .on('debug', info => console.log(info))
    .on('message', new DiscordCmdHandlerBuilder({
            cmdHandlers: [
                TacCmdHandlingService, 
                TacMusicCmdHandlingService
            ],
            cmdPrefix: '--',
            onUnknownCmd: ({msg, cmd}) => msg.reply(`Unknown command "${cmd}".`)
        })
        .buildMessageHandler()
    )
    .on('ready', () => log.info(`🚀  Discord bot is listening on port ${config.port}`))
    .login(config.discordBotToken)
    .catch(err => log.error(err, `bootstrapping error, discord bot failed to log in`));

