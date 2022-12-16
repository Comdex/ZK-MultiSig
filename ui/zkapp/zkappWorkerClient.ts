import { fetchAccount, PublicKey, PrivateKey, Field } from "snarkyjs";

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from "./zkappWorker";

export type AccountJSON = {
  publicKey: string;
  delegate: string;
  balance: string;
  nonce: string;
  verificationKey: string;
};

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  loadSnarkyJS() {
    return this._call("loadSnarkyJS", {});
  }

  setActiveInstanceToBerkeley() {
    return this._call("setActiveInstanceToBerkeley", {});
  }

  loadContract() {
    return this._call("loadContract", {});
  }

  compileContract() {
    return this._call("compileContract", {});
  }

  fetchAccount({
    publicKey58,
  }: {
    publicKey58: string;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call("fetchAccount", {
      publicKey58,
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  async getAccountJSON({
    publicKey58,
  }: {
    publicKey58: string;
  }): Promise<AccountJSON> {
    const result = await this._call("getAccountJSON", { publicKey58 });

    return JSON.parse(result as string);
  }

  initZkappInstance(publicKey58: string) {
    return this._call("initZkappInstance", {
      publicKey58,
    });
  }

  //   async getNum(): Promise<Field> {
  //     const result = await this._call("getNum", {});
  //     return Field.fromJSON(JSON.parse(result as string));
  //   }

  //   createUpdateTransaction() {
  //     return this._call("createUpdateTransaction", {});
  //   }

  proveUpdateTransaction() {
    return this._call("proveUpdateTransaction", {});
  }

  async getTransactionJSON() {
    const result = await this._call("getTransactionJSON", {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL("./zkappWorker.ts", import.meta.url), {
      type: "module",
    });
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };

    this.worker.onerror = (err: ErrorEvent) => {
      console.error(err);
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
