import bcrypt from 'bcrypt'
import jsSHA from 'jssha'

export class Password {
    _val : string = ''
    _isHash : boolean
    constructor(value: string, isHash: boolean) {
        this._val = value;
        this._isHash = isHash;
    }

    async getHash(hashAlgorithm : HashAlgorithm) {
        if (this._isHash)
            return this._val;
        switch(hashAlgorithm) {
            case "bcrypt":
                let salt = await bcrypt.genSalt();
                return await bcrypt.hash(this._val, salt);
            case "sha256":
                let sha256 = new jsSHA('SHA-256', 'TEXT', {encoding: 'UTF8'});
                sha256.update(this._val);
                return sha256.getHash('HEX').toLowerCase();
        }
    }
    async compare(plaintext : string, hashAlgorithm : HashAlgorithm) {
        if (!this._isHash)
            return this._val === plaintext;
        switch(hashAlgorithm) {
            case "bcrypt":
                return await bcrypt.compare(plaintext, this._val);
            case "sha256":
                let sha256 = new jsSHA('SHA-256', 'TEXT', {encoding: 'UTF8'});
                sha256.update(plaintext);
                return this._val.toLowerCase() === sha256.getHash('HEX').toLowerCase();
        }
    }
}