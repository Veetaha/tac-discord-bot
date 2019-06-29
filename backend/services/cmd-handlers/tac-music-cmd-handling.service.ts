import Joi from 'typesafe-joi';
import Ytdl from 'ytdl-core';
import Discord from 'discord.js';
import { Service } from "typedi";
import { Nullable } from 'ts-typedefs';

import { DiscordCmdEndpoint } from "@modules/discord/meta/discord-cmd-endpoint.decorator";
import { DiscordCmdHandlerFnCtx } from "@modules/discord/discord.interfaces";
import { LoggingService } from '../logging.service';
import { DiscordMemberError } from '@modules/discord/errors/discord-member-error.class';

// TODO
@Service()
export class TacMusicCmdHandlingService {
    private dispatcher?: Nullable<Discord.StreamDispatcher>;
    private voiceConnection?: Nullable<Discord.VoiceConnection>;

    constructor(readonly log: LoggingService) {}

    // tryConnectToVoiceChannel(voiceChannel: Nullable<Discord.VoiceChannel>) {
    //     if 
    // }


    @DiscordCmdEndpoint({
        cmd: ['play-music'],
        description: "Play music.",
        params: { 
            definition: [{ 
                name: 'youtube_url',
                description: 'Connects to your voice channel and plays music that you request.',
                schema: Joi.string().uri()
            }] 
        }
    })
    // TODO: fix this abomination, split into several methods and introduce a queue
    async onMusic({msg, params: [url]}: DiscordCmdHandlerFnCtx<[string]>) {
        const {voiceChannel} = msg.member;
        if (voiceChannel == null) {
            throw new DiscordMemberError({
                title: 'Not in a voice channel error.',
                description: 'You need to be in a voice channel before playing the music.',
                violator: msg.member
            });
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user)!;
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            throw new DiscordMemberError({
                title: "Permissions error",
                description: 'I need the permissions to join and speak in your voice channel.',
                violator: msg.member
            });
        }
        if (this.voiceConnection == null) {
            const conn = msg.client.voiceConnections.find(con => con.channel.id === voiceChannel.id);
            if (conn != null) {
                await msg.channel.send('Using existing voice connection');
                this.voiceConnection = conn;
            } else {
                this.voiceConnection = voiceChannel.connection;
                voiceChannel.leave();
                if (this.voiceConnection == null) {
                    this.voiceConnection = await voiceChannel.join();
                    await msg.channel.send(`Connected to voice channel "${voiceChannel.name}".`);
                }
            }
        }
        const info = await Ytdl.getInfo(url);

        const stream = Ytdl.downloadFromInfo(info, { 
            filter: 'audioonly', quality: 'highestaudio',
            
        });
        if (this.dispatcher != null) {
            this.dispatcher.end('Received new track');
        }
        this.dispatcher = this.voiceConnection.playStream(stream)
            .on('start', async () => {
                await msg.channel.send(`Now playing "${info.title}"`);
            })
            .on('end', async reason => {
                await msg.channel.send(`Composition "${info.title}" has ended (${reason})`);
            })
            .on('error', error => console.error(error));
    }


}