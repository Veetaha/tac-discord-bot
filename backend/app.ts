import '@app/polyfills';
import Discord from 'discord.js';
import Container from 'typedi';

import { ConfigService  } from '@services/config.service';
import { LoggingService } from '@services/logging.service';
import { DiscordCmdHandlingManager } from '@modules/discord/discord-cmd-handling-manager.class';

// Import command handling services in order to registrea them in dependency injection
// system
import '@services/cmd-handlers/tac-cmd-handling.service';
import '@services/cmd-handlers/tac-music-cmd-handling.service';

const config = Container.get(ConfigService);
const log    = Container.get(LoggingService);
const cmdMgr = Container.get(DiscordCmdHandlingManager)
    .init({
        cmdPrefix: '--',
        onUnknownCmd: ({msg, cmd}) => msg.reply(`Unknown command "${cmd}".`)
    });

new Discord.Client()
    .on('debug', info => console.log(info))
    .on('message', msg => cmdMgr.tryHandleCmd(msg))
    .on('ready', () => log.info(`🚀  Discord bot is listening.`))
    .login(config.discordBotToken)
    .catch(err => log.error(err, `bootstrapping error, discord bot failed to log in`));

