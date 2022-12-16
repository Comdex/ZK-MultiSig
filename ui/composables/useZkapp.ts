import {
  AccountUpdate,
  fetchAccount,
  isReady,
  Mina,
  PrivateKey,
  PublicKey,
  UInt32,
  VerificationKey,
} from "snarkyjs";
import { MultiSigZkapp, ApproverHashes } from "zk-multi-sig";
// import ZkappWorkerClient from "../zkapp/zkappWorkerClient";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

export default function () {
  type ZkappState = {
    hasBeenSetup: boolean;
    hasBeenCompiled: boolean;
    MultiSigZkapp: null | typeof MultiSigZkapp;
    zkApp: null | MultiSigZkapp;
    transaction: null | Transaction;

    creatingTransaction: boolean;
    walletName: null | string;
    walletPublicKey: null | PublicKey;
    walletPublicKey58: null | string;

    approvers: null | { name: string | null; address: string }[];
    approverHashes: null | ApproverHashes;
    approverThreshold: null | UInt32;

    signerPrivateKey: null | PrivateKey;
    signerPublicKey: null | PublicKey;
    signerPublicKey58: null | string;
    // zkappWorkerClient: null | ZkappWorkerClient;
  };

  const zkappState = useState<ZkappState>("zkappState", () => {
    return {
      hasBeenSetup: false,
      hasBeenCompiled: false,
      MultiSigZkapp: null as null | typeof MultiSigZkapp,
      zkApp: null as null | MultiSigZkapp,
      transaction: null as null | Transaction,

      creatingTransaction: false,
      walletName: null as null | string,
      walletPublicKey: null as null | PublicKey,
      walletPublicKey58: null as null | string,

      approvers: [] as { name: string | null; address: string }[],
      approverThreshold: null as null | UInt32,
      approverHashes: null as null | ApproverHashes,

      signerPrivateKey: null as null | PrivateKey,
      signerPublicKey: null as null | PublicKey,
      signerPublicKey58: null as null | string,
      // zkappWorkerClient: null as null | ZkappWorkerClient,
    };
  });

  const loadSnarkyJS = async () => {
    console.log("Loading SnarkyJS...");
    await isReady;
    console.log("Loading Done");
  };

  const setActiveInstanceToBerkeley = () => {
    const Berkeley = Mina.Network(
      "https://proxy.berkeley.minaexplorer.com/graphql"
    );
    Mina.setActiveInstance(Berkeley);
    console.log("SetActiveInstanceToBerkeley Done");
  };

  const loadContract = async () => {
    const { MultiSigZkapp } = await import("zk-multi-sig");
    zkappState.value.MultiSigZkapp = MultiSigZkapp;
    console.log("Load Contract Done");
  };

  const compileContract = async (): Promise<VerificationKey> => {
    console.log("start compile contract");
    console.time("compile MultiSigZkapp");
    let { verificationKey } = await zkappState.value.MultiSigZkapp!.compile();
    zkappState.value.hasBeenCompiled = true;
    console.timeEnd("compile MultiSigZkapp");

    return verificationKey as VerificationKey;
  };

  const getAccount = async (publicKey58: string) => {
    const publicKey = PublicKey.fromBase58(publicKey58);
    return await fetchAccount({ publicKey });
  };

  const getApproverHashes = () => {
    const approverHashes = zkappState.value.zkApp!.approverHashes.get();
    return approverHashes;
  };

  const getApproverThreshold = () => {
    const approverThreshold = zkappState.value.zkApp!.approverThreshold.get();
    return approverThreshold;
  };

  const getLatestProposalHash = () => {
    const latestProposalHash = zkappState.value.zkApp!.latestProposalHash.get();
    return latestProposalHash;
  };

  type AccountJSON = {
    publicKey: string;
    delegate: string | undefined;
    balance: string;
    nonce: string;
    verificationKey: string | undefined;
  };

  const getAccountJSON = async (
    publicKey58: string
  ): Promise<AccountJSON | null> => {
    const publicKey = PublicKey.fromBase58(publicKey58);
    const result = await fetchAccount({ publicKey });
    if (result.error != null) {
      return null;
    }
    let accountJSON = {
      publicKey: result.account.publicKey.toBase58(),
      delegate: result.account.delegate?.toBase58(),
      balance: result.account.balance.toString(),
      nonce: result.account.nonce.toString(),
      verificationKey: result.account.verificationKey,
    };

    return accountJSON;
  };

  const proveUpdateTransaction = async () => {
    console.log("start prove transaction");
    await zkappState.value.transaction!.prove();
    console.log("end Prove transaction");
  };

  const getTransactionJSON = () => {
    return zkappState.value.transaction!.toJSON();
  };

  const initZkappInstance = (publicKey58: string) => {
    const publicKey = PublicKey.fromBase58(publicKey58);
    zkappState.value.zkApp = new zkappState.value.MultiSigZkapp!(publicKey);
  };

  const deployWallet = async ({
    zkAppPrivateKey,
    verificationKey,
    approvers,
    approverThreshold,
  }: {
    zkAppPrivateKey: PrivateKey;
    verificationKey: VerificationKey;
    approvers: PublicKey[];
    approverThreshold: UInt32;
  }) => {
    const transactionFee = 100_000_000;
    let transaction = await Mina.transaction(
      { feePayerKey: zkappState.value.signerPrivateKey!, fee: transactionFee },
      () => {
        AccountUpdate.fundNewAccount(zkappState.value.signerPrivateKey!);

        zkappState.value.zkApp.deploy({
          zkappKey: zkAppPrivateKey,
          verificationKey,
          approvers,
          approverThreshold,
        });
      }
    );

    console.log("Sending the deploy transaction...");
    const res = await transaction.send();
    const hash = res.hash(); // This will change in a future version of SnarkyJS
    if (hash == null) {
      console.log("error sending transaction (see above)");
    } else {
      console.log(
        "See deploy transaction at",
        "https://berkeley.minaexplorer.com/transaction/" + hash
      );
    }

    return hash;
  };

  return {
    zkappState,
    initZkappInstance,
    loadSnarkyJS,
    setActiveInstanceToBerkeley,
    loadContract,
    compileContract,
    getAccount,
    getApproverHashes,
    getApproverThreshold,
    getLatestProposalHash,
    getAccountJSON,
    proveUpdateTransaction,
    getTransactionJSON,
    deployWallet,
  };
}
