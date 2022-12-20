import {
  AccountUpdate,
  fetchAccount,
  isReady,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
  UInt32,
  UInt64,
} from "snarkyjs";
import type {
  MultiSigZkapp,
  ApproverHashes,
  Proposal,
  ProposalWithSigns,
} from "zk-multi-sig";
// import ZkappWorkerClient from "../zkapp/zkappWorkerClient";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

export default function () {
  const { mina2Nano, nano2Mina } = useUtils();

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
    walletNonce: null | number;
    walletBalance: null | string;

    approvers: null | { name: string | null; address: string }[];
    approverHashes: null | ApproverHashes;
    approverThreshold: null | number;

    signerPrivateKey: null | PrivateKey;
    signerPublicKey: null | PublicKey;
    signerPublicKey58: null | string;
    signerBalance: null | string;
    // zkappWorkerClient: null | ZkappWorkerClient;
  };

  const currentWalletAddress = useState<null | string>(
    "currentWalletAddress",
    () => null
  );
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
      walletNonce: null as null | number,
      walletBalance: null as null | string,

      approvers: [] as { name: string | null; address: string }[],
      approverThreshold: null as null | number,
      approverHashes: null as null | ApproverHashes,

      signerPrivateKey: null as null | PrivateKey,
      signerPublicKey: null as null | PublicKey,
      signerPublicKey58: null as null | string,
      signerBalance: null as null | string,
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

  const compileContract = async (): Promise<{ data: string; hash: string }> => {
    console.log("start compile contract");
    console.time("compile MultiSigZkapp");
    let { verificationKey } = await zkappState.value.MultiSigZkapp!.compile();
    zkappState.value.hasBeenCompiled = true;
    console.timeEnd("compile MultiSigZkapp");

    return verificationKey;
  };

  const getAccount = async (publicKey58: string) => {
    const publicKey = PublicKey.fromBase58(publicKey58);
    return await fetchAccount({ publicKey });
  };

  const getApproverHashes = () => {
    console.log(
      "approverHashes address: ",
      zkappState.value.zkApp?.address.toBase58()
    );

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
    nonce: number;
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
      nonce: Number(result.account.nonce.toBigint()),
      verificationKey: result.account.verificationKey,
    };

    return accountJSON;
  };

  const createApproverHashes = async (approvers: PublicKey[]) => {
    const { ApproverHashes } = await import("zk-multi-sig");
    return ApproverHashes.createWithPadding(approvers);
  };

  const createProposal = async ({
    contractAddress,
    contractNonce,
    desc,
    amount,
    receiver,
  }: {
    contractAddress: string;
    contractNonce: number;
    desc: string;
    amount: string;
    receiver: string;
  }): Promise<Proposal> => {
    const tempContractAddress = PublicKey.fromBase58(contractAddress);
    const tempContractNonce = UInt32.from(contractNonce);
    const tempAmount = UInt64.from(mina2Nano(amount));
    const tempReceiver = PublicKey.fromBase58(receiver);
    const { Proposal } = await import("zk-multi-sig");
    return Proposal.create({
      contractAddress: tempContractAddress,
      contractNonce: tempContractNonce,
      desc,
      amount: tempAmount,
      receiver: tempReceiver,
    });
  };

  const getProposalFields = async ({
    contractAddress,
    contractNonce,
    desc,
    amount,
    receiver,
  }: {
    contractAddress: string;
    contractNonce: number;
    desc: string;
    amount: string;
    receiver: string;
  }) => {
    const tempContractAddress = PublicKey.fromBase58(contractAddress);
    const tempContractNonce = UInt32.from(contractNonce);
    const tempAmount = UInt64.from(mina2Nano(amount));
    const tempReceiver = PublicKey.fromBase58(receiver);
    const { Proposal } = await import("zk-multi-sig");
    const p = Proposal.create({
      contractAddress: tempContractAddress,
      contractNonce: tempContractNonce,
      desc,
      amount: tempAmount,
      receiver: tempReceiver,
    });

    return Proposal.toFields(p);
  };

  const createProposalWithSigns = async (value: {
    proposal: Proposal;
    approvers: PublicKey[];
    signs: Signature[];
  }): Promise<ProposalWithSigns> => {
    const { ProposalWithSigns } = await import("zk-multi-sig");
    const ps = ProposalWithSigns.create(
      value.proposal,
      value.approvers,
      value.signs
    );
    ps.padding();

    return ps;
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
    verificationKey: { data: string; hash: string };
    approvers: PublicKey[];
    approverThreshold: UInt32;
  }) => {
    const transactionFee = 100_000_000;
    let transaction = await Mina.transaction(
      { feePayerKey: zkappState.value.signerPrivateKey!, fee: transactionFee },
      () => {
        AccountUpdate.fundNewAccount(zkappState.value.signerPrivateKey!);

        zkappState.value.zkApp!.deploy({
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

  const sendAssets = async (p: ProposalWithSigns) => {
    const transactionFee = 100_000_000;

    await getAccount(zkappState.value.walletPublicKey58!);
    let transaction = await Mina.transaction(
      { feePayerKey: zkappState.value.signerPrivateKey!, fee: transactionFee },
      () => {
        zkappState.value.zkApp!.sendAssets(p);
      }
    );
    console.log("proving the transaction...");
    await transaction.prove();

    console.log("Sending the transaction...");
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

  const refreshWalletState = async () => {
    if (zkappState.value.walletPublicKey58 != null) {
      console.log("refresh multi-wallet state");
      const accountJson = await getAccountJSON(
        zkappState.value.walletPublicKey58
      );
      zkappState.value.walletBalance = nano2Mina(
        accountJson?.balance!
      ).toString();
      zkappState.value.walletNonce = accountJson?.nonce!;
      zkappState.value.approverHashes = getApproverHashes();
      zkappState.value.approverThreshold = Number(
        getApproverThreshold().toString()
      );
    }
  };

  const refreshSignerState = async () => {
    if (zkappState.value.signerPublicKey58 != null) {
      console.log("refresh signer state");
      const accountJson = await getAccountJSON(
        zkappState.value.signerPublicKey58!
      );
      zkappState.value.signerBalance = nano2Mina(
        accountJson?.balance!
      ).toString();
    }
  };

  return {
    zkappState,
    currentWalletAddress,
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
    createApproverHashes,
    createProposal,
    getProposalFields,
    sendAssets,
    createProposalWithSigns,
    refreshWalletState,
    refreshSignerState,
  };
}
