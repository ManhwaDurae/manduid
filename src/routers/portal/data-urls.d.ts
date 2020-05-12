declare module 'data-urls' {
    type ParsedDataUrl = {
        mimeType: string;
        body: Buffer;
    };

    export default function parseDataUrl(dataUrl: string): ParsedDataUrl;
}
