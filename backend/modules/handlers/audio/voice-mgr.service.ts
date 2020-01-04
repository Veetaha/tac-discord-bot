import ds from 'discord.js';
import { Nullable } from 'ts-typedefs';
import { unwrapNotNil } from 'ts-not-nil';
import { Service } from 'typedi';

import { NotInVoiceChannelError, BotPermissionsError } from '@modules/discord-cmd/errors/cmd.errors';
import { AppFreezeGuard } from '@modules/config/app-freeze-guard.decorator';
import { LoggingService } from '@modules/logging/logging.service';


@Service()
export class VoiceMgrService {
    private connection?: Nullable<ds.VoiceConnection>;
    /** Returns currently established voice connection. */
    getConnection() { return this.connection; }

    constructor(private readonly log: LoggingService) {}

    /**
     * Returns connection that was established with `voiceChannel`. Reuses previous
     * connection if that one already binds this bot to `voiceChannel`.
     *
     * Throws `UserError` if client doesn't have permissions to join to `voiceChannel`.
     *
     * @param voiceChannel `Ds.VoiceChannel` to establish connection to.
     */
    @AppFreezeGuard
    async connectToChannelOrFail(voiceChannel: Nullable<ds.VoiceChannel>) {
        if (voiceChannel == null) throw new NotInVoiceChannelError(
            'You need to be in a voice channel before playing the music.'
        );
        if (!voiceChannel.joinable) throw new BotPermissionsError(
            `I don't have permissions to join your voice channel or channel is full.`
        );
        if (!voiceChannel.speakable) throw new BotPermissionsError(
            `I don't have permissions to speak in your voice channel or channel.`
        );
        await this.connectToChannelOrFailImpl(voiceChannel);
        return unwrapNotNil(this.connection, "Connection was established on the above line.");
    }
    private async connectToChannelOrFailImpl(voiceChannel: ds.VoiceChannel): Promise<void> {
        if (this.connection == null) {
            this.log.info(
                `VoiceMgrService: joining to voice channel ${voiceChannel.name} ` +
                `(current voice connection is set to null)`
            );

            this.connection = await voiceChannel.join();

            return void this.log.info(
                `VoiceMgrService: joined to voice channel ${voiceChannel.name}`
            );
        }
        if (this.connection.channel.id === voiceChannel.id) return void this.log.info(
            `VoiceMgrService: reusing the previous voice connection for request ` +
            `to join to voice channel ${this.connection.channel.name}`
        );

        this.log.info(
            `VoiceMgrService: disconnecting from voice channel ${this.connection.channel.name} ` +
            `and simultaneously joining to new voice channel`
        );
        this.connection.disconnect();
        this.connection = await voiceChannel.join();
        this.log.info(`VoiceMgrService: joined to voice channel ${voiceChannel.name} (after disconnect)`);
    }
}
