declare module 'ytdl-core-discord' {
    import { downloadOptions } from 'ytdl-core';    
    import { Readable } from 'stream';

    function download(url: string, options?: downloadOptions): Promise<Readable>;
    export default download;
}