declare module 'gif-extract-frames' {
    import Ndarr from 'ndarray';

    export interface ExtractFramesOpts {
        input: string;
        output?: string;
        coalesce?: boolean;
    }
    function extractFrames(opts: ExtractFramesOpts): Promise<Ndarr<number>>;
    export default extractFrames;
}