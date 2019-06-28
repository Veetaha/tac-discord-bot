// import Fs from 'fs';
import Joi from 'typesafe-joi';
import Ytdl from 'ytdl-core';
import Discord from 'discord.js';
import { Service } from "typedi";
import { Nullable } from 'ts-typedefs';

import { DiscordCmdEndpoint } from "@modules/discord/discord-cmd-endpoint.decorator";
import { DiscordCmdHandlerFnCtx } from "@modules/discord/discord-handler.interfaces";


@Service()
export class TacMusicCmdHandlingService {
    private dispatcher?: Nullable<Discord.StreamDispatcher>;
    private voiceConnection?: Nullable<Discord.VoiceConnection>;

    @DiscordCmdEndpoint({
        cmd: ['play-music'],
        description: "Play music.",
        paramSchemas: [Joi.string().uri()]
    })
    async onMusic({msg, params: [url]}: DiscordCmdHandlerFnCtx) {
        const {voiceChannel} = msg.member;
        if (voiceChannel == null) {
            throw new Error('you need to be in a voice channel before playing the music.');
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user)!;
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            throw new Error('I need the permissions to join and   speak in your voice channel!');
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
            .on('debug', inf => {
                console.log(`Dispatcher: ${inf}`);
            })
            .on('speaking', sp => console.log(`Speaking: ${sp}`))
            .on('start', async () => {
                await msg.channel.send(`Now playing "${info.title}"`);
            })
            .on('end', async reason => {
                await msg.channel.send(`Composition "${info.title}" has ended (${reason})`);
            })
            .on('error', error => console.error(error));
    }


}