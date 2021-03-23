import { sign } from "tweetnacl";
import { Address } from "../address";
import { ISignable } from "../interface";
import { Signature } from "../signature";
import { MessageVersion, MessageSigner } from "./messageParams";
const createKeccakHash = require("keccak");

const MESSAGE_VERSION = new MessageVersion(1);
const MESSAGE_PREFIX = "\x17Elrond Signed Message:\n";

export class Message implements ISignable {

    /**
     * Signer of the message.
     */
    address: Address;

    /**
     * Actual message being signed.
     */
    value: Buffer;

    /**
     * Signature obtained by a signer of type @param signer .
     */
    signature: Signature;

    /**
     * Message version code in case we modify this schema.
     */
    version: MessageVersion;

    /**
     * Specifies which ISigner is to be used to sign and verify this message.
     */
    signer: MessageSigner;

    public constructor(init?: Partial<Message>) {
        this.address = Address.Zero();
        this.value = Buffer.from([]);
        this.signature = new Signature();
        this.version = MESSAGE_VERSION;
        this.signer = MessageSigner.Wallet;

        Object.assign(this, init);
    }

    serializeForSigning(_signedBy: Address): Buffer {
        let bytesToHash = Buffer.concat([Buffer.from(MESSAGE_PREFIX), this.value]);
        let hash = createKeccakHash("keccak256").update(bytesToHash).digest();
        return hash;
    }

    applySignature(signature: Signature, signedBy: Address): void {
        this.signature = signature;
        this.address = signedBy;
    }

    static fromPlainObject(address: string, value: string, signature: string, signer: string, version?: number): Message {
        let parsedSigner = (<any>MessageSigner)[signer];
        
        return new Message({
            address: new Address(address),
            value: Buffer.from(value, "hex"),
            signature: signature.length > 0 ? new Signature(signature) : undefined,
            signer: parsedSigner != undefined ? parsedSigner : MessageSigner.Wallet,
            version: version != undefined ? new MessageVersion(version) : new MessageVersion(1)
        });
    }

    toPlainObject(): any {
        let result: any = {
            address: this.address.hex,
            value: this.value.toString("hex"),
            signature: this.signature.isEmpty() ? undefined : this.signature.hex(),
            version: this.version.valueOf() > 1 ? this.version.valueOf() : undefined,
            signer: this.signer
        };

        return result;
    }
}
