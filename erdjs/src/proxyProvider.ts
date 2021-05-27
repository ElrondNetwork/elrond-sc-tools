import Axios, { AxiosTransformer } from "axios";
import { IProvider } from "./interface";
import { Transaction, TransactionHash, TransactionStatus } from "./transaction";
import { NetworkConfig } from "./networkConfig";
import { Address } from "./address";
import * as errors from "./errors";
import { AccountOnNetwork } from "./account";
import { Query } from "./smartcontracts/query";
import { QueryResponse } from "./smartcontracts/queryResponse";
import { Logger } from "./logger";
import { NetworkStatus } from "./networkStatus";
import { TransactionOnNetwork } from "./transactionOnNetwork";
const JSONbig = require("json-bigint");

/**
 * This will be deprecated once all the endpoints move to ApiProvider
 */
export class ProxyProvider implements IProvider {
    private url: string;
    private timeoutLimit: number;

    /**
     * Creates a new ProxyProvider.
     * @param url the URL of the Elrond Proxy
     * @param timeout the timeout for any request-response, in milliseconds
     */
    constructor(url: string, timeout?: number) {
        this.url = url;
        this.timeoutLimit = timeout || 1000;
    }

    /**
     * Fetches the state of an {@link Account}.
     */
    async getAccount(address: Address): Promise<AccountOnNetwork> {
        return this.doGetGeneric(`address/${address.bech32()}`, (response) =>
            AccountOnNetwork.fromHttpResponse(response.account)
        );
    }

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    async queryContract(query: Query): Promise<QueryResponse> {
        try {
            let data = query.toHttpRequest();
            return this.doPostGeneric("vm-values/query", data, (response) =>
                QueryResponse.fromHttpResponse(response.data || response.vmOutput)
            );
        } catch (err) {
            throw errors.ErrContractQuery.increaseSpecificity(err);
        }
    }

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    async sendTransaction(tx: Transaction): Promise<TransactionHash> {
        return this.doPostGeneric(
            "transaction/send",
            tx.toSendable(),
            (response) => new TransactionHash(response.txHash)
        );
    }

    /**
     * Simulates the processing of an already-signed {@link Transaction}.
     */
    async simulateTransaction(tx: Transaction): Promise<any> {
        return this.doPostGeneric("transaction/simulate", tx.toSendable(), (response) => response);
    }

    /**
     * Fetches the state of a {@link Transaction}.
     */
    async getTransaction(
        txHash: TransactionHash,
        hintSender?: Address,
        withResults?: boolean
    ): Promise<TransactionOnNetwork> {
        let url = this.buildUrlWithQueryParameters(`transaction/${txHash.toString()}`, {
            withSender: hintSender ? hintSender.bech32() : "",
            withResults: withResults ? "true" : "",
        });

        return this.doGetGeneric(url, (response) => TransactionOnNetwork.fromHttpResponse(response.transaction));
    }

    /**
     * Queries the status of a {@link Transaction}.
     */
    async getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus> {
        return this.doGetGeneric(
            `transaction/${txHash.toString()}/status`,
            (response) => new TransactionStatus(response.status)
        );
    }

    /**
     * Fetches the Network configuration.
     */
    async getNetworkConfig(): Promise<NetworkConfig> {
        return this.doGetGeneric("network/config", (response) => NetworkConfig.fromHttpResponse(response.config));
    }

    /**
     * Fetches the network status configuration.
     */
    async getNetworkStatus(): Promise<NetworkStatus> {
        return this.doGetGeneric("network/status/4294967295", (response) =>
            NetworkStatus.fromHttpResponse(response.status)
        );
    }

    /**
     * Get method that receives the resource url and on callback the method used to map the response.
     */
    async doGetGeneric(resourceUrl: string, callback: (response: any) => any): Promise<any> {
        let response = await this.doGet(resourceUrl);
        return callback(response);
    }

    /**
     * Post method that receives the resource url, the post payload and on callback the method used to map the response.
     */
    async doPostGeneric(resourceUrl: string, payload: any, callback: (response: any) => any): Promise<any> {
        let response = await this.doPost(resourceUrl, payload);
        return callback(response);
    }

    private async doGet(resourceUrl: string): Promise<any> {
        try {
            let url = `${this.url}/${resourceUrl}`;
            let response = await axios.get(url, { timeout: this.timeoutLimit });
            let payload = response.data.data;
            return payload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private async doPost(resourceUrl: string, payload: any): Promise<any> {
        try {
            let url = `${this.url}/${resourceUrl}`;
            let response = await axios.post(url, payload, {
                timeout: this.timeoutLimit,
                headers: {
                    "Content-Type": "application/json",
                },
            });
            let responsePayload = response.data.data;
            return responsePayload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private buildUrlWithQueryParameters(endpoint: string, params: Record<string, string>): string {
        let searchParams = new URLSearchParams();

        for (let [key, value] of Object.entries(params)) {
            if (value) {
                searchParams.append(key, value);
            }
        }

        return `${endpoint}?${searchParams.toString()}`;
    }

    private handleApiError(error: any, resourceUrl: string) {
        if (!error.response) {
            Logger.warn(error);
            throw new errors.ErrApiProviderGet(resourceUrl, error.toString(), error);
        }

        let errorData = error.response.data;
        let originalErrorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        throw new errors.ErrApiProviderGet(resourceUrl, originalErrorMessage, error);
    }
}

// See: https://github.com/axios/axios/issues/983
const bigIntTransformer: AxiosTransformer = (data: any) => {
  if (typeof data === 'string') {
    try {
      data = JSONbig.parse(data);
    } catch (e) { /* Ignore */ }
  }
  return data;
}

const axios = Axios.create({
  // First try to parse data with bigInt parse, then run default parsers
  transformResponse: ([] as any).concat(
    bigIntTransformer,
    Axios.defaults.transformResponse,
  )
});
