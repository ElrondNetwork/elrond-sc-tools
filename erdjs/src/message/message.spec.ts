import { assert } from "chai";
import { Address } from "../address";
import { UserSecretKey, UserSigner } from "../walletcore";
import { Message, MessageVerifier } from ".";

describe("test message signed and verified", () => {
    let message = new Message({ value: Buffer.from("test message", "utf-8") });
    let signer = new UserSigner(UserSecretKey.fromString("1a927e2af5306a9bb2ea777f73e06ecc0ac9aaa72fb4ea3fecf659451394cccf"));
    let address = "erd1l453hd0gt5gzdp7czpuall8ggt2dcv5zwmfdf3sd3lguxseux2fsmsgldz";
    let otherAddress = "erd1cux02zersde0l7hhklzhywcxk4u9n4py5tdxyx7vrvhnza2r4gmq4vw35r";

    it("address should sign message", async () => {
        await signer.sign(message);

        assert.equal(message.address.bech32(), address);
        assert.isFalse(message.signature.isEmpty());
        assert.equal(message.signature.hex(), "8dff87a65baf0d4142772f93b4de52d74e86a704dfd34cc4a0b592355915e86a5b1ede687eb1f1fd79c0a41fde35df5aab986a12d3f60ea3361982d5308f5c0c");
    });

    it("should verify correct signature", async () => {
        await signer.sign(message);
        let verifier = MessageVerifier.fromMessage(message);
        let validSig = await verifier.verify(message);

        assert.isTrue(validSig);
    });

    it("should not verify if wrong address signed", async () => {
        await signer.sign(message);
        message.address = Address.fromString(otherAddress);
        let verifier = MessageVerifier.fromMessage(message);
        let validSig = await verifier.verify(message);

        assert.isFalse(validSig);
    });
});
