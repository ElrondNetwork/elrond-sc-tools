import { ISignatureVerifier } from "../interface";
import { Message } from "../message/message";
import { UserPublicKey } from "./userKeys";
import * as errors from "../errors";
import { Address } from "../address";
import * as tweetnacl from "tweetnacl";
const createKeccakHash = require("keccak");

const EXPECTED_MESSAGE_PREFIX = "\x17Elrond Signed Message:\n";

/**
 * ed25519 signature verification
 */
export class UserVerifier implements ISignatureVerifier {

    publicKey: UserPublicKey;

    constructor(publicKey: UserPublicKey) {
        this.publicKey = publicKey;
    }

    static fromString(value: string): ISignatureVerifier {
        return UserVerifier.fromAddress(Address.fromString(value));
    }

    static fromAddress(address: Address): ISignatureVerifier {
        let publicKey = new UserPublicKey(Buffer.from(address.hex(), "hex"));
        return new UserVerifier(publicKey);
    }

    /**
     * Verify a message's signature.
     * @param message the message to be verified.
     */
    async verify(message: Message): Promise<boolean> {
        try {
            let bytesToHash = Buffer.concat([Buffer.from(EXPECTED_MESSAGE_PREFIX), message.value]);
            let hash = createKeccakHash("keccak256").update(bytesToHash).digest();
            let unopenedMessage = Buffer.concat([Buffer.from(message.signature.hex(), "hex"), hash]);
            let unsignedMessage = tweetnacl.sign.open(unopenedMessage, this.publicKey.valueOf());
            return unsignedMessage != null;
        } catch (err) {
            throw new errors.ErrSignerCannotVerify(err);
        }
    }
}
