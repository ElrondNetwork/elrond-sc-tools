import { AddImmediateResult, loadAndSyncAlice, MarkNotarized, MockProvider, setupUnitTestWatcherTimeouts, TestWallet } from "../../testutils";
import { Address } from "../../address";
import { assert } from "chai";
import { QueryResponse } from "../queryResponse";
import { TransactionStatus } from "../../transaction";
import { ReturnCode } from "../returnCode";
import { Balance } from "../../balance";
import BigNumber from "bignumber.js";
import { ContractWrapper } from "./contractWrapper";

describe("test smart contract wrapper", async function () {
    let dummyAddress = new Address("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
    let provider = new MockProvider();
    let alice: TestWallet;
    before(async function () {
        alice = await loadAndSyncAlice(provider);
    });

    it("should interact with 'answer'", async function () {
        setupUnitTestWatcherTimeouts();

        let answer = await ContractWrapper.fromAbi(provider, "answer", "src/testdata/answer.abi.json", null);
        answer.address(dummyAddress).caller(alice).gas(500_000);

        mockQuery(provider, "getUltimateAnswer", "Kg==");

        let queryResult = await answer.query.getUltimateAnswer();
        assert.deepEqual(queryResult, new BigNumber(42));

        let callResult = await mockCall(provider, "@6f6b@2b", answer.getUltimateAnswer());
        assert.deepEqual(callResult, new BigNumber(43));
    });

    it("should interact with 'counter'", async function () {
        setupUnitTestWatcherTimeouts();

        let counter = await ContractWrapper.fromAbi(provider, "counter", "src/testdata/counter.abi.json", null);
        counter.address(dummyAddress).caller(alice).gas(500_000);

        // For "get()", return fake 7
        mockQuery(provider, "get", "Bw==");

        let counterValue = await counter.query.get();
        assert.deepEqual(counterValue, new BigNumber(7));

        // Return fake 8
        let valueAfterIncrement = await mockCall(provider, "@6f6b@08", counter.increment());
        assert.deepEqual(valueAfterIncrement, new BigNumber(8));

        // Decrement. Return fake 7.
        let decrementResult = await mockCall(provider, "@6f6b@07", counter.decrement());
        assert.deepEqual(decrementResult, new BigNumber(7));
    });

    it("should interact with 'lottery_egld'", async function () {
        setupUnitTestWatcherTimeouts();

        let lottery = await ContractWrapper.fromAbi(provider, "Lottery", "src/testdata/lottery_egld.abi.json", null);
        lottery.address(dummyAddress).caller(alice).gas(5_000_000);

        await mockCall(provider, "@6f6b", lottery.start("lucky", Balance.egld(1), null, null, 1, null, null));

        //assert.equal(startInteraction.buildTransaction().getData().toString(), "start@6c75636b79@0de0b6b3a7640000@@@0100000001@@");

        let status = await mockCall(provider, "@6f6b@01", lottery.status("lucky"));
        assert.equal(status, "Running");

        let info = await mockCall(
            provider,
            "@6f6b@000000080de0b6b3a764000000000320000000006012a806000000010000000164000000000000000000000000",
            lottery.lotteryInfo("lucky")
        );
        //assert.equal(getLotteryInfoInteraction.buildTransaction().getData().toString(), "lotteryInfo@6c75636b79");

        assert.deepEqual(info, {
            ticket_price: new BigNumber("1000000000000000000"),
            tickets_left: new BigNumber(800),
            deadline: new BigNumber("1611835398"),
            max_entries_per_user: new BigNumber(1),
            prize_distribution: Buffer.from([0x64]),
            whitelist: [],
            current_ticket_number: new BigNumber(0),
            prize_pool: new BigNumber("0")
        });
    });
});

function mockQuery(provider: MockProvider, functionName: string, mockedResult: string) {
    provider.mockQueryResponseOnFunction(functionName, new QueryResponse({ returnData: [mockedResult], returnCode: ReturnCode.Ok }));
}

async function mockCall(provider: MockProvider, mockedResult: string, promise: Promise<any>) {
    let [, value] = await Promise.all([
        provider.mockNextTransactionTimeline([new TransactionStatus("executed"), new AddImmediateResult(mockedResult), new MarkNotarized()]),
        promise
    ]);
    return value;
}
