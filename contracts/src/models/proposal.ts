import {
  Bool,
  Circuit,
  Encoding,
  Field,
  PublicKey,
  Signature,
  Struct,
  UInt32,
  UInt64,
} from 'snarkyjs';
import {
  DUMMY_PRIVATEKEY,
  DUMMY_PUBLICKEY,
  MAX_APPROVER_NUM,
  MAX_DESC_FIELD_NUM,
} from '../constant';
import { verifySignByApprovers } from '../provable_utils';
import { ApproverHashes } from './contract_state';

export { Proposal, ProposalWithSigns };

class Proposal extends Struct({
  contractAddress: PublicKey,
  contractNonce: UInt32,
  desc: Circuit.array(Field, MAX_DESC_FIELD_NUM),
  amount: UInt64,
  receiver: PublicKey,
}) {
  static create(value: {
    contractAddress: PublicKey;
    contractNonce: UInt32;
    desc: string;
    amount: UInt64;
    receiver: PublicKey;
  }): Proposal {
    let descFields = Encoding.Bijective.Fp.fromString(value.desc);
    if (descFields.length > MAX_DESC_FIELD_NUM) {
      throw new Error(
        `The desc exceeds the maximum length of fields: ${MAX_DESC_FIELD_NUM}`
      );
    }

    let paddingDesc = descFields.concat(
      Array(MAX_DESC_FIELD_NUM - descFields.length).fill(Field(0))
    );

    let proposal = new Proposal({
      contractAddress: value.contractAddress,
      contractNonce: value.contractNonce,
      desc: paddingDesc,
      amount: value.amount,
      receiver: value.receiver,
    });

    return proposal;
  }

  toJSONValue(): {
    contractAddress: string;
    contractNonce: string;
    desc: string;
    amount: string;
    receiver: string;
  } {
    return {
      contractAddress: this.contractAddress.toBase58(),
      contractNonce: this.contractNonce.toString(),
      desc: Encoding.Bijective.Fp.toString(this.desc),
      amount: this.amount.toString(),
      receiver: this.receiver.toBase58(),
    };
  }

  static fromJSONValue(value: {
    contractAddress: string;
    contractNonce: string;
    desc: string;
    tokenId: string;
    amount: string;
    receiver: string;
  }): Proposal {
    let descFields = Encoding.Bijective.Fp.fromString(value.desc);
    if (descFields.length > MAX_DESC_FIELD_NUM) {
      throw new Error(
        `The desc exceeds the maximum length of fields: ${MAX_DESC_FIELD_NUM}`
      );
    }

    let paddingDesc = descFields.concat(
      Array(MAX_DESC_FIELD_NUM - descFields.length).fill(Field(0))
    );

    return new Proposal({
      contractAddress: PublicKey.fromBase58(value.contractAddress),
      contractNonce: UInt32.from(value.contractNonce),
      desc: paddingDesc,
      amount: UInt64.from(value.amount),
      receiver: PublicKey.fromBase58(value.receiver),
    });
  }
}

class ProposalWithSigns extends Struct({
  proposal: Proposal,
  approvers: Circuit.array(PublicKey, MAX_APPROVER_NUM),
  signs: Circuit.array(Signature, MAX_APPROVER_NUM),
}) {
  static create(
    proposal: Proposal,
    approvers?: PublicKey[],
    signs?: Signature[]
  ): ProposalWithSigns {
    return new ProposalWithSigns({
      proposal,
      approvers: approvers ? approvers : [],
      signs: signs ? signs : [],
    });
  }

  toJSONValue(): any {
    return {
      proposal: (this.proposal as any).toJSONValue(),
      approvers: this.approvers.map((v) => v.toBase58()),
      signs: this.signs.map((v) => v.toJSON()),
    };
  }

  padding() {
    let approversLen = this.approvers.length;
    if (approversLen < MAX_APPROVER_NUM) {
      this.approvers = this.approvers.concat(
        Array(MAX_APPROVER_NUM - approversLen).fill(DUMMY_PUBLICKEY)
      );
    }

    let signsLen = this.signs.length;
    if (signsLen < MAX_APPROVER_NUM) {
      this.signs = this.signs.concat(
        Array(MAX_APPROVER_NUM - signsLen).fill(
          Signature.create(DUMMY_PRIVATEKEY, [Field(0)])
        )
      );
    }
  }

  addSignWithPublicKey(sign: Signature, publicKey: PublicKey) {
    if (!this.proposal) {
      throw new Error(`Proposal has not been initialized`);
    }
    if (!this.signs) {
      this.signs = [];
    }

    if (
      this.signs.length > MAX_APPROVER_NUM ||
      this.approvers.length > MAX_APPROVER_NUM
    ) {
      throw new Error(
        `The number of Approver or Signature is greater than the limit: ${MAX_APPROVER_NUM}`
      );
    }

    this.signs.push(sign);
    this.approvers.push(publicKey);
  }

  // verify proposal
  verify(approverHashes: ApproverHashes, approverThreshold: UInt32): Bool {
    let signFields = Proposal.toFields(this.proposal);

    return verifySignByApprovers(
      signFields,
      this.signs,
      this.approvers,
      approverHashes,
      approverThreshold
    );
  }
}
