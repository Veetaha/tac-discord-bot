import Fs from 'fs';
import Axios from 'axios';
import { Service } from 'typedi';
import { Readable } from 'stream';

@Service()
export class NetService {
    downloadFileOrFail(url: string, outfilePath: string): Promise<void> {
        return Axios
            .get<Readable>(url, { responseType: 'stream' })
            .then(({data}) => new Promise<void>((resolve, reject) => data
                .pipe(Fs.createWriteStream(outfilePath))
                .once('finish', resolve)
                .once('error', reject)
            )
        );
    }
}
