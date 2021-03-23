import { ISignatureVerifier } from "../interface";
import { UserVerifier } from "../walletcore";
import { Message } from "./message";
import { MessageSigner } from "./messageParams";

export class MessageVerifier {

    static fromMessage(message: Message): ISignatureVerifier {
        switch (message.signer) {
            case MessageSigner.Wallet:
            case MessageSigner.Ledger:
                return UserVerifier.fromAddress(message.address);
        }
    }
}
