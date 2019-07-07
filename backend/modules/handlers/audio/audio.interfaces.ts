import Ds from 'discord.js';

export interface YtVidOrder {
    /** Raw youtube video url input by `.customer`. */
    ytUrlOrQuery: string;
    /** Message the track was ordered with. */
    msg: Ds.Message;
}