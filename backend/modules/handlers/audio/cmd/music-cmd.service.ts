import Joi from 'typesafe-joi';
import Ds from 'discord.js';
import { Service  } from "typedi";
import { Nullable } from "ts-typedefs";

import { CmdEndpoint     } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";
import { ConfigService   } from '@modules/config.service';

import { AudioQueueService  } from "../audio-queue.service";
import { AudioTrack         } from '../audio-track.class';
import { MusicMgrService    } from '../music-mgr.service';
import { AudioPlayerService } from '../audio-player.service';


@Service()
export class MusicCmdService {
    constructor(
        private readonly musicMgr:    MusicMgrService,
        private readonly audioQueue:  AudioQueueService, 
        private readonly audioPlayer: AudioPlayerService,
        private readonly config:      ConfigService
    ) {}


    @CmdEndpoint({
        cmd: ['music', 'm'],
        cooldownTime: 1000 * 5, 
        description:
             `Plays music or displays current music queue (if no paramteres given).` +
             `If there is already a track playing your order is scheduled to be the last in the queue. ` +
             `Bot connects to your voice channel and plays music that you request.`,
        params: { 
            minRequiredAmount: 0,
            definition: [{ 
                name: 'youtube_url_or_vid_name',
                description: 'Youtube video url or video name to search.',
                schema: Joi.string()
            }] 
        }
    })
    async onMusic({msg, params: [ytUrlOrQuery]}: CmdHandlerFnCtx<[Nullable<string>]>) {
        if (ytUrlOrQuery == null) {
            await this.sendAudioQueueInfo(msg);
            return;
        }
        await this.audioQueue.streamOrEnqueueYtVidOrderOrFail({ ytUrlOrQuery, msg });   
    }
    
    private async sendAudioQueueInfo(msg: Ds.Message) {
        if (this.audioQueue.isEmpty()) {
            return msg.channel.send(new Ds.RichEmbed({
                title: "Audio queue is empty.",
                description: 
                    "There are no tracks active or scheduled. Be first to order your " +
                    "favourite music!",
                color: this.config.music.emptyQueueEmbedColor
            }));
        }
        const messages: ReturnType<Ds.TextChannel['send']>[] = [];
        let i = 0;
        this.audioQueue.forEachTrackInQueue(audioTrack => {
            messages.push(msg.channel.send(i === 0 
                ? this.createActiveMusicEmbed(audioTrack)
                : this.createScheduledMusicEmbed(audioTrack, i)
            ));
            ++i;
        });
        return Promise.all(messages);
    }

    private createActiveMusicEmbed(track: AudioTrack) {
        return new Ds.RichEmbed({
            title: `**Active${this.audioPlayer.isPaused() ? ' (paused)**' : '**'}`,
            description: track.toMd(),
            color:     this.config.music.activeTrackEmbedColor,
            thumbnail: { url: track.getThumbnailUrl() },
            footer:    this.musicMgr.createActiveTrackFooter()
        });
    }

    private createScheduledMusicEmbed(track: AudioTrack, queueIndex: number) {
        return new Ds.RichEmbed({
            title: `#${queueIndex}`,
            description: track.toMd(),
            footer: this.musicMgr.createScheduledTrackFooter(track)
        });
    }


}