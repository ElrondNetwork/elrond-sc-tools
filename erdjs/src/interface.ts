import { Transaction, TransactionHash, TransactionOnNetwork, TransactionStatus } from "./transaction";
import { NetworkConfig } from "./networkConfig";
import { Signature } from "./signature";
import { Address } from "./address";
import { AccountOnNetwork } from "./account";
import { Query, QueryResponse } from "./smartcontracts/query";
import { NetworkStake } from "./networkStake";
import { Stats } from "./stats";
import { NetworkStatus } from "./networkStatus";
import { Message } from "./message/message";

/**
 * An interface that defines the endpoints of an HTTP API Provider.
 */
export interface IProvider {
    /**
     * Fetches the Network configuration.
     */
    getNetworkConfig(): Promise<NetworkConfig>;

    /**
     * Fetches the Network status.
     */
    getNetworkStatus(): Promise<NetworkStatus>;

    /**
     * Fetches the state of an {@link Account}.
     */
    getAccount(address: Address): Promise<AccountOnNetwork>;

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    queryContract(query: Query): Promise<QueryResponse>;

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    sendTransaction(tx: Transaction): Promise<TransactionHash>;

    /**
     * Simulates the processing of an already-signed {@link Transaction}.
     */
    simulateTransaction(tx: Transaction): Promise<TransactionHash>;

    /**
     * Fetches the state of a {@link Transaction}.
     */
    getTransaction(txHash: TransactionHash): Promise<TransactionOnNetwork>;

    /**
     * Queries the status of a {@link Transaction}.
     */
    getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus>;
}

/**
 * An interface that defines the endpoints of an HTTP API Provider.
 */
export interface IApiProvider {
    /**
     * Fetches the Network Stake.
     */
    getNetworkStake(): Promise<NetworkStake>;
    /**
     * Fetches the Network Stats.
     */
    getNetworkStats(): Promise<Stats>;
}

/**
 * An interface that defines a signing-capable object.
 */
export interface ISigner {
    /**
     * Gets the {@link Address} of the signer.
     */
    getAddress(): Address;

    /**
     * Signs a message (e.g. a {@link Transaction}).
     */
    sign(signable: ISignable): Promise<void>;
}

export interface ISignatureVerifier {

    verify(message: Message): Promise<boolean>;
}

/**
 * An interface that defines a signable object (e.g. a {@link Transaction}).
 */
export interface ISignable {
    /**
     * Returns the signable object in its raw form - a sequence of bytes to be signed.
     */
    serializeForSigning(signedBy: Address): Buffer;

    /**
     * Applies the computed signature on the object itself.
     *
     * @param signature The computed signature
     * @param signedBy The address of the {@link Signer}
     */
    applySignature(signature: Signature, signedBy: Address): void;
}

/**
 * An interface that defines a disposable object.
 */
export interface Disposable {
    dispose(): void;
}
