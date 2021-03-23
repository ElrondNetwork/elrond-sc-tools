import * as errors from "../errors";
import { Address } from "../address";
import { ISignable, ISigner } from "../interface";
import { Signature } from "../signature";
import { UserSecretKey } from "./userKeys";
import { UserWallet } from "./userWallet";

/**
 * ed25519 signer
 */
export class UserSigner implements ISigner {
    private readonly secretKey: UserSecretKey;

    constructor(secretKey: UserSecretKey) {
        this.secretKey = secretKey;
    }

    static fromWallet(keyFileObject: any, password: string): ISigner {
        let secretKey = UserWallet.decryptSecretKey(keyFileObject, password);
        return new UserSigner(secretKey);
    }

    static fromPem(text: string, index: number = 0): ISigner {
        let secretKey = UserSecretKey.fromPem(text, index);
        return new UserSigner(secretKey);
    }
    
    /**
     * Signs a message.
     * @param signable the message to be signed (e.g. a {@link Transaction}).
     */
    async sign(signable: ISignable): Promise<void> {
        try {
            this.trySign(signable);
        } catch (err) {
            throw new errors.ErrSignerCannotSign(err);
        }
    }

    private trySign(signable: ISignable) {
        let signedBy = this.getAddress();
        let bufferToSign = signable.serializeForSigning(signedBy);
        let signatureBuffer = this.secretKey.sign(bufferToSign);
        let signature = new Signature(signatureBuffer);

        signable.applySignature(signature, signedBy);
    }

    /**
     * Gets the address of the signer.
     */
    getAddress(): Address {
        return this.secretKey.generatePublicKey().toAddress();
    }
}
