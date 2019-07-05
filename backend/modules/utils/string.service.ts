import { DebugService } from "@modules/debug.service";
import { Service } from "typedi";

@Service()
export class StringService {
    constructor(private readonly debug: DebugService) {}

    /**
     * Returns an iterator over the chunks of the `str` with maximum length of
     * `chunkLength`.
     * Pre: chunkLength > 0.
     * 
     * @param str         Traget string to split into chunks.
     * @param chunkLength Maximum length of chunks to emit.
     */
    *splitIntoChunks(str: string, chunkLength: number) {
        this.debug.assert(() => chunkLength > 0);
        let i = 0;
        while (i < str.length - chunkLength) {
            yield str.slice(i, i + chunkLength);
            i += chunkLength;
        }
        yield str.slice(i);
    }

}