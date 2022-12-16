import {
  Circuit,
  Encoding,
  Field,
  PublicKey,
  Struct,
  UInt32,
  VerificationKey,
} from 'snarkyjs';
import {
  EMPTY_PUBLICKEY,
  MAX_APPROVER_NUM,
  MAX_DESC_FIELD_NUM,
} from '../constant';

export {
  ApproversUpdate,
  ContractUpdate,
  ContractUpdateEvent,
  ThresholdUpdate,
  DelegateUpdate,
};

class ApproversUpdate extends Struct({
  contractAddress: PublicKey,
  contractNonce: UInt32,
  approvers: Circuit.array(PublicKey, MAX_APPROVER_NUM),
}) {
  padding() {
    this.approvers = this.approvers.concat(
      Array(MAX_APPROVER_NUM - this.approvers.length).fill(EMPTY_PUBLICKEY)
    );
  }

  addApprover(approver: PublicKey) {
    if (!this.approvers) {
      this.approvers = [];
    }

    if (this.approvers.some((v) => v.equals(approver))) {
      throw new Error(`This approver already exists: ${approver.toBase58()}`);
    }

    this.approvers.push(approver);
  }
}

class ContractUpdateEvent extends Struct({
  contractAddress: PublicKey,
  contractNonce: UInt32,
  reason: Circuit.array(Field, MAX_DESC_FIELD_NUM),
  vkHash: Field,
}) {}

class ContractUpdate extends Struct({
  contractAddress: PublicKey,
  contractNonce: UInt32,
  reason: Circuit.array(Field, MAX_DESC_FIELD_NUM),
  vk: VerificationKey,
}) {
  static create(value: {
    contractAddress: PublicKey;
    contractNonce: UInt32;
    reason: string;
    vk: VerificationKey;
  }): ContractUpdate {
    let reasonFields = Encoding.Bijective.Fp.fromString(value.reason);
    if (reasonFields.length > MAX_DESC_FIELD_NUM) {
      throw new Error(
        `The desc exceeds the maximum length of fields: ${MAX_DESC_FIELD_NUM}`
      );
    }

    let paddingReason = reasonFields.concat(
      Array(MAX_DESC_FIELD_NUM - reasonFields.length).fill(Field(0))
    );

    return new ContractUpdate({
      contractAddress: value.contractAddress,
      contractNonce: value.contractNonce,
      reason: paddingReason,
      vk: value.vk,
    });
  }

  toEvent(): ContractUpdateEvent {
    return {
      contractAddress: this.contractAddress,
      contractNonce: this.contractNonce,
      reason: this.reason,
      vkHash: this.vk.hash,
    };
  }
}

class ThresholdUpdate extends Struct({
  contractAddress: PublicKey,
  contractNonce: UInt32,
  newThreshold: UInt32,
}) {}

class DelegateUpdate extends Struct({
  contractAddress: PublicKey,
  contractNonce: UInt32,
  newDelegate: PublicKey,
}) {}
