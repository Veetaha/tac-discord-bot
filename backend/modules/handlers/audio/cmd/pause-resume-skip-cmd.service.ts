import ds from 'discord.js';
import { Service } from "typedi";

import { CmdEndpoint } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";

import { AudioQueueService } from "../audio-queue.service";

@Service()
export class PauseResumeSkipCmdService {
    constructor(private readonly audioQueue: AudioQueueService) {}

    @CmdEndpoint({
        cmd: ['pause', 'p'],
        description: 'Pauses currently playing audio track.'
    })
    async onPauseMusic({msg}: CmdHandlerFnCtx) {
        this.audioQueue.pauseCurrentTrackOrFail();
        await msg.channel.send(new ds.RichEmbed({
            description: `Track ${this.audioQueue.getCurrentTrack()!.toMd()} was set on pause.`
        }));
    }

    @CmdEndpoint({
        cmd: ['resume', 'r'],
        description: 'Resumes current audio track.'
    })
    async onResumeMusic({msg}: CmdHandlerFnCtx) {
        this.audioQueue.resumeCurrentTrackOrFail();
        await msg.channel.send(new ds.RichEmbed({
            description: `Track ${this.audioQueue.getCurrentTrack()!.toMd()} was resumed.`
        }));
    }

    @CmdEndpoint({
        cmd: ['skip', 's'],
        description: 'Skips currently playing audio track.'
    })
    async onSkipMusic() {
        this.audioQueue.skipCurrentTrackOrFail();
    }
}
