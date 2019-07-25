import { Service } from "typedi";
import { Stream } from "stream";

import { StreamToBufferError } from "./errors";

@Service()
export class StreamService {

    /**
     * Returns a promise for `Buffer` that contains all data that was emitted by
     * given `stream`. 
     * 
     * @throws `StreamToBufferError` if 'error' event was emitted by stream.
     * 
     * @param stream Stream to collect data into a buffer from.
     */
    streamToBufferOrFail(stream: Stream) {
        return new Promise<Buffer>((resolve, reject) => {
            const buffers: Buffer[] = [];
            let totalLength = 0;
            stream.on('data', (chunk: Buffer) => {
                buffers.push(chunk);
                totalLength += chunk.length;
            });
            stream.on('end', () => resolve(Buffer.concat(buffers, totalLength)));
            stream.on('error', err => reject(
                new StreamToBufferError('readable stream emitted error event', err)
            ));
        });
    }

}