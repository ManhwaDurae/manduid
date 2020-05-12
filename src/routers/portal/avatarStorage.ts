import { promises as fs, createReadStream } from 'fs';
import path from 'path';
const avatarDir = path.join(process.cwd(), 'avatar');

const getFilenameByUid = async (uid: string): Promise<string> => {
    const dir = await fs.readdir(avatarDir, { withFileTypes: true, encoding: 'utf8' });
    for (const i of dir) if (i.isFile() && i.name.startsWith(uid + '.')) return i.name;
    return null;
};
const getAvatarPathByUid = async (uid: string): Promise<string> =>
    path.join(avatarDir, await getFilenameByUid(uid));
const simpleEncoder = {
    encode: (str: string): string => {
        const result: number[] = [];
        for (let i = 0; i < str.length; i++) result.push(str.charCodeAt(i));
        return result.join('_');
    },
    decode: (str: string): string => {
        const encoded: number[] = str.split('_').map(i => Number(i.trim()));
        let result = '';
        for (let i = 0; i < encoded.length; i++) result = String.fromCharCode(encoded[i]);
        return result;
    }
};

class AvatarStorage {
    async has(uid: string): Promise<boolean> {
        return Boolean(await getFilenameByUid(uid));
    }
    async getMimeType(uid: string): Promise<string> {
        const filename = await getFilenameByUid(uid);
        return simpleEncoder.decode(filename.substring(filename.lastIndexOf('.')));
    }
    getFallbackUrl(uid: string): string {
        return 'https://www.gravatar.com/avatar/' + uid + '?d=identicon';
    }
    async upload(uid: string, mime: string, buffer: Buffer): Promise<void> {
        const filename = path.join(avatarDir, uid + '.' + simpleEncoder.encode(mime));
        await fs.writeFile(filename, buffer);
    }
    async remove(uid: string): Promise<void> {
        const path = await getAvatarPathByUid(uid);
        await fs.unlink(path);
    }
    async get(uid: string): Promise<NodeJS.ReadableStream> {
        return createReadStream(await getAvatarPathByUid(uid));
    }
    async pipe(uid: string, stream: NodeJS.WritableStream): Promise<void> {
        const fstr = await this.get(uid);
        fstr.pipe(stream);
    }
}

const storage = new AvatarStorage();
export default storage;
