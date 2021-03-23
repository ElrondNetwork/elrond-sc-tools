import * as errors from "../errors";

export class MessageVersion {
    /**
     * The actual numeric value.
     */
    private readonly value: number;

    /**
     * Creates a MessageVersion object given a value.
     */
    constructor(value: number) {
        value = Number(value);
        
        if (value < 1) {
            throw new errors.ErrMessageVersionInvalid(value);
        }

        this.value = value;
    }

    valueOf(): number {
        return this.value;
    }
}

export enum MessageSigner {
    Wallet = "wallet",
    Ledger = "ledger"
}
