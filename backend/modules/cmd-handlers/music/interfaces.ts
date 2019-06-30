import Ds from 'discord.js';

export interface YtVidOrder {
    /** Raw youtube video url input by `.customer` */
    ytUrl: string;
    /** Guild member that has ordered an audio track from youtube to play.  */
    customer: Ds.GuildMember;
}