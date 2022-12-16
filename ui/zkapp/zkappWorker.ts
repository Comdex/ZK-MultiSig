import {
  Mina,
  isReady,
  PublicKey,
  PrivateKey,
  Field,
  fetchAccount,
} from "snarkyjs";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import { MultiSigZkapp, ApproverHashes } from "zk-multi-sig";

const state = {
  MultiSigZkapp: null as null | typeof MultiSigZkapp,
  zkApp: null as null | MultiSigZkapp,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  loadSnarkyJS: async (args: {}) => {
    await isReady;
  },
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      "https://proxy.berkeley.minaexplorer.com/graphql"
    );
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    // zk-multi-sig
    const { MultiSigZkapp } = await import("zk-multi-sig");
    state.MultiSigZkapp = MultiSigZkapp;
  },
  compileContract: async (args: {}) => {
    console.time("compile MultiSigZkapp");
    await state.MultiSigZkapp!.compile();
    console.timeEnd("compile MultiSigZkapp");
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkApp = new state.MultiSigZkapp!(publicKey);
  },
  getApproverHashes: async (args: {}) => {
    const approverHashes = state.zkApp!.approverHashes.get();
    return JSON.stringify(ApproverHashes.toJSON(approverHashes));
  },
  getApproverThreshold: async (args: {}) => {
    const approverThreshold = state.zkApp!.approverThreshold.get();
    return JSON.stringify(approverThreshold.toJSON());
  },
  getLatestProposalHash: async (args: {}) => {
    const latestProposalHash = state.zkApp!.latestProposalHash.get();
    return JSON.stringify(latestProposalHash.toJSON());
  },

  getAccountJSON: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    const result = await fetchAccount({ publicKey });
    let accountJSON = {
      publicKey: result.account?.publicKey.toBase58(),
      delegate: result.account?.delegate?.toBase58(),
      balance: result.account?.balance.toString(),
      nonce: result.account?.nonce.toString(),
      verificationKey: result.account?.verificationKey,
    };
    return JSON.stringify(accountJSON);
  },
  // createUpdateTransaction: async (args: {}) => {
  //   const transaction = await Mina.transaction(() => {
  //     state.zkapp!.update();
  //   });
  //   state.transaction = transaction;
  // },
  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

addEventListener("message", async (event: MessageEvent<ZkappWorkerRequest>) => {
  const returnData = await functions[event.data.fn](event.data.args);

  const message: ZkappWorkerReponse = {
    id: event.data.id,
    data: returnData,
  };
  postMessage(message);
});
