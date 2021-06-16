import { Address, Balance, TransactionPayload, ProxyProvider, NetworkConfig, Transaction, UserSigner, UserSecretKey, GasLimit, Account, Err } from "@elrondnetwork/erdjs";

declare var $: any;

$(async function () {
    let signer = new UserSigner(UserSecretKey.fromString(getPrivateKey()));
    let provider = new ProxyProvider(getProxyUrl());
    let account = new Account(new Address());
    let transaction = new Transaction({ receiver: new Address() });

    try {
        NetworkConfig.getDefault().sync(provider);
    } catch (error) {
        onError(error);
    }

    $("#LoadAccountButton").click(async function () {
        try {
            signer = new UserSigner(UserSecretKey.fromString(getPrivateKey()));
            account = new Account(signer.getAddress());
            await account.sync(provider);

            $("#AccountAddress").text(account.address.bech32());
            $("#AccountNonce").text(account.nonce.valueOf());
            $("#AccountBalance").text(account.balance.toCurrencyString());
        } catch (error) {
            onError(error);
        }
    });

    $("#PrepareButton").click(async function () {
        let receiver = getReceiver();
        let value = getTransferValue();
        let memo = getTransferMemo();
        let gasLimit = GasLimit.forTransfer(memo);

        transaction = new Transaction({
            nonce: account.nonce,
            receiver: receiver,
            value: value,
            data: memo,
            gasLimit: gasLimit
        });

        displayObject("PreparedTransactionContainer", transaction.toPlainObject());
    });

    $("#SignButton").click(async function () {
        try {
            signer = new UserSigner(UserSecretKey.fromString(getPrivateKey()));
            signer.sign(transaction);
            displayObject("SignedTransactionContainer", transaction.toPlainObject());
        } catch (error) {
            onError(error);
        }
    });

    $("#BroadcastButton").click(async function () {
        try {
            let transactionHash = await transaction.send(provider);
            displayUint8Array( 'BroadcastedTransactionContainer', transactionHash.hash,);
        } catch (error) {
            onError(error);
        }
    });

    $("#QueryButton").click(async function () {
        try {
            await transaction.getAsOnNetwork(provider);
            displayObject("QueriedTransactionContainer", transaction.toPlainObject());
        } catch (error) {
            onError(error);
        }
    });
});

function onError(error: Error) {
    let html = Err.html(error);
    $("#ErrorModal .error-text").html(html);
    $("#ErrorModal").modal("show");
}

function getProxyUrl(): string {
    return $("#ProxyInput").val();
}

function getReceiver(): Address {
    let receiverInput = $("#ReceiverInput").val();
    return new Address(receiverInput);
}

function getTransferValue(): Balance {
    let valueInput = Number($("#ValueInput").val());
    let balance = Balance.egld(valueInput);
    return balance;
}

function getTransferMemo(): TransactionPayload {
    let memoInput = $("#MemoInput").val();
    return new TransactionPayload(memoInput);
}

function getPrivateKey(): string {
    return $("#PrivateKeyInput").val().trim();
}

function displayObject(container: string, obj: any) {
    // Note that stringify will throw an error when the "5. Query transaction" button is clicked, probably because in this case "obj" contains BigNumber, which cannot be stringified. The error message defaults to "Address is empty".
    let json = JSON.stringify(obj, null, 4);
    $(`#${container}`).html(json);
}

const LUT_HEX_4b = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
const LUT_HEX_8b = new Array(0x100);
for (let n = 0; n < 0x100; n++) {
  LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xf]}${LUT_HEX_4b[n & 0xf]}`;
}
// End Pre-Init
function toHex(buffer: Uint8Array) {
  let out = '';
  for (let idx = 0, edx = buffer.length; idx < edx; idx++) {
    out += LUT_HEX_8b[buffer[idx]];
  }
  return out;
}

function displayUint8Array(container: string, u8a: any) {
  // Note that stringify will throw an error when the "5. Query transaction" button is clicked, probably because in this case "obj" contains BigNumber, which cannot be stringified. The error message defaults to "Address is empty".
  console.log('displayObject', 'container: ', container, 'u8a: ', u8a);
  let s = toHex(u8a);
  $(`#${container}`).html(s);
}
