import Ds from 'discord.js';
import { Nullable } from 'ts-typedefs';
import { Service } from 'typedi';

import { NotInVoiceChannelError, BotPermissionsError } from '@modules/discord-cmd/errors/cmd.errors';
import { AppFreezeGuard } from '@modules/config/app-freeze-guard.decorator';


@Service()
export class VoiceMgrService {
    private connection?: Nullable<Ds.VoiceConnection>;
    /** Returns currently established voice connection. */
    getConnection() { return this.connection; }

    constructor() {}

    /**
     * Returns connection that was established with `voiceChannel`. Reuses previous
     * connection if that one already binds this bot to `voiceChannel`.
     * 
     * Throws `UserError` if client doesn't have permissions to join to `voiceChannel`.
     * 
     * @param voiceChannel `Ds.VoiceChannel` to establish connection to.
     */
    @AppFreezeGuard
    async connectToChannelOrFail(voiceChannel: Nullable<Ds.VoiceChannel>) {
        if (voiceChannel == null) {
            throw new NotInVoiceChannelError(
                'You need to be in a voice channel before playing the music.'
            );
        }
        if (!voiceChannel.joinable || !voiceChannel.speakable) {
            throw new BotPermissionsError(
                `I don't have permissions to join and speak in your voice channel or channel is full`
            );
        }
        await this.connectToChannelOrFailImpl(voiceChannel);
        return this.connection!;
    }
    private async connectToChannelOrFailImpl(voiceChannel: Ds.VoiceChannel){
        if (this.connection == null) {
            this.connection = await voiceChannel.join();
            return;
        }
        if (this.connection.channel.id === voiceChannel.id) return;  
        this.connection.disconnect();
        this.connection = await voiceChannel.join();
    }
    
}