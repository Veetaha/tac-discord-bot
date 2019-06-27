import Discord from 'discord.js';
export interface DiscordCmdHandlerFnCtx {
    /** Command that this handler was invoked with. */
    readonly cmd: string;      
    
    /** Original discord message that was received. */
    readonly msg: Discord.Message;
    /** 
     * Array of positional parameters that were forwarded to the handler by the user. 
     */
    readonly params: string[];
}

/** 
 * Defines the type of function that implements the command buisness logic.
 */
export type DiscordCmdHandlerFn = (ctx: DiscordCmdHandlerFnCtx) => void | Promise<unknown>;

/** 
 * Defines the type of function that is passed to `discordClient.on('message', ...)` 
 */
export type DiscordMsgHandlerFn = (msg: Discord.Message) => void | Promise<unknown>;