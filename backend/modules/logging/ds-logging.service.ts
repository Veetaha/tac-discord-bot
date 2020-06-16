import ds from 'discord.js';
import { Service } from "typedi";
import { Nullable } from 'ts-typedefs';

import { DsUtilsService } from '@modules/handlers/ds-utils.service';

import { LoggingService, LogType } from "./logging.service";
import { ConfigService } from '@modules/config/config.service';
import { assertNotNil } from 'ts-not-nil';

/**
 * Production loggin service that sends log messages to discord development chat.
 */
@Service()
export class DsLoggingService extends LoggingService {

    logChannel: Nullable<ds.TextChannel>;

    constructor(
        private readonly dsUtils: DsUtilsService,
        dsClient:   ds.Client,
        {logGuild}: ConfigService
    ) {
        super();
        dsClient.once('ready', () => {
            const guild     = dsClient.guilds.cache.find(({name}) => name === logGuild.name);
            assertNotNil(guild);
            this.logChannel = dsUtils.getGuildWritableTextChannelOrFail(guild, logGuild.channelName);
        });
    }

    writeLog(logType: LogType, msg: string): void {
        if (!this.logChannel) {
            super.writeLog(logType, msg);
            return;
        }
        this.dsUtils
            .sendMsgInChunksToFit(
                this.logChannel,
                `${'```'}${this.createMsgPrefix(logType)}${msg}${'```'}`
            )
            .catch(err => {
                console.warn(`Failed to log "${msg}"`);
                console.warn('Error: ');
                console.error(err);
            });
    }

}
