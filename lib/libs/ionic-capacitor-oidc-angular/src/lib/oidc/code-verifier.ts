// Cannot take credit, source:
// https://gist.github.com/stupiduglyfool/3a5bd9e121330013c78fbfe0697cf76d#file-codeverifier-ts
import * as sjcl from 'sjcl';

export class CodeVerifier {
    public challenge: string;
    public method: string;
    public verifier: string;

    constructor() {
        this.verifier = this.getVerifier();

        this.challenge = CodeVerifier.sha256(this.verifier);
        this.method = 'S256';
    }

    public static sha256(value: string): string {
        const hash = sjcl.hash.sha256.hash(value);
        return sjcl.codec.base64url.fromBits(hash);
    }

    private getVerifier() {
        const verifierBits = sjcl.random.randomWords(8);
        return sjcl.codec.base64url.fromBits(verifierBits);
    }
}
