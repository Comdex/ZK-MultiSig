import {
  Field,
  SmartContract,
  state,
  State,
  method,
  UInt32,
  Permissions,
  PublicKey,
  Poseidon,
  Bool,
  PrivateKey,
  AccountUpdate,
} from 'snarkyjs';

import { ApproverHashes } from './models/contract_state';

import { Permit } from './models/permit';
import { Proposal, ProposalWithSigns } from './models/proposal';
import {
  ContractUpdateEvent,
  ApproversUpdate,
  ThresholdUpdate,
  ContractUpdate,
  DelegateUpdate,
} from './models/updates';

export class MultiSigZkapp extends SmartContract {
  @state(ApproverHashes as any) approverHashes = State<ApproverHashes>();
  @state(UInt32) approverThreshold = State<UInt32>();
  @state(Field) latestProposalHash = State<Field>();

  events = {
    proposal: Proposal as any,
    contractUpdate: ContractUpdateEvent as any,
    approversUpdate: ApproversUpdate as any,
    thresholdUpdate: ThresholdUpdate,
    delegateUpdate: DelegateUpdate,
  };

  deploy(args: {
    approvers: PublicKey[];
    approverThreshold: UInt32;
    zkappKey?: PrivateKey | undefined;
    verificationKey?:
      | {
          data: string;
          hash: string | Field;
        }
      | undefined;
  }) {
    super.deploy(args);

    this.approverHashes.set(ApproverHashes.createWithPadding(args.approvers));
    this.approverThreshold.set(args.approverThreshold);
    this.latestProposalHash.set(Field(0));
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proof(),
      send: Permissions.proof(),
      incrementNonce: Permissions.proof(),
      setVerificationKey: Permissions.proof(),
      setPermissions: Permissions.proof(),
      setDelegate: Permissions.proof(),
      setVotingFor: Permissions.proof(),
      setZkappUri: Permissions.proof(),
      setTokenSymbol: Permissions.proof(),
    });
  }

  @method
  sendAssets(proposalWithSigns: ProposalWithSigns) {
    let approverHashes = this.approverHashes.get();
    this.approverHashes.assertEquals(approverHashes);

    let approverThreshold = this.approverThreshold.get();
    this.approverThreshold.assertEquals(approverThreshold);

    // In order to prevent replay attacks, it is necessary to check the contractAddress and
    // contractNonce in the signature, and the nonce of the contract also needs to be incremented
    // in each transaction.
    let proposal = proposalWithSigns.proposal;
    this.account.nonce.assertEquals(proposal.contractNonce);
    this.self.publicKey.assertEquals(proposal.contractAddress);
    this.self.body.incrementNonce = Bool(true);

    proposalWithSigns
      .verify(approverHashes, approverThreshold)
      .assertTrue(
        'Proposal has wrong signature or does not meet apporverThreshold'
      );

    this.send({
      to: proposalWithSigns.proposal.receiver,
      amount: proposalWithSigns.proposal.amount,
    });

    this.latestProposalHash.set(Poseidon.hash(Proposal.toFields(proposal)));

    this.emitEvent('proposal', proposal);
  }

  @method
  approvePermit(permit: Permit): Bool {
    return this.approvePermitInternal(permit);
  }

  approvePermitInternal(permit: Permit): Bool {
    let approverHashes = this.approverHashes.get();
    this.approverHashes.assertEquals(approverHashes);

    let approverThreshold = this.approverThreshold.get();
    this.approverThreshold.assertEquals(approverThreshold);

    return permit.verify(approverHashes, approverThreshold);
  }

  @method
  updateApprovers(permit: Permit, update: ApproversUpdate) {
    let authDataHash = Poseidon.hash(ApproversUpdate.toFields(update));
    permit.authDataHash.assertEquals(
      authDataHash,
      'Permit and ApproversUpdate must be consistent'
    );

    this.account.nonce.assertEquals(update.contractNonce);
    this.self.publicKey.assertEquals(update.contractAddress);
    this.self.body.incrementNonce = Bool(true);

    this.approvePermitInternal(permit).assertTrue('Permit verification failed');
    this.approverHashes.set(ApproverHashes.createInCircuit(update.approvers));

    this.emitEvent('approversUpdate', update);
  }

  @method
  updateApproverThreshold(permit: Permit, update: ThresholdUpdate) {
    let authDataHash = Poseidon.hash(ThresholdUpdate.toFields(update));
    permit.authDataHash.assertEquals(
      authDataHash,
      'Permit and ThresholdUpdate must be consistent'
    );

    this.account.nonce.assertEquals(update.contractNonce);
    this.self.publicKey.assertEquals(update.contractAddress);
    this.self.body.incrementNonce = Bool(true);

    this.approvePermitInternal(permit).assertTrue('Permit verification failed');
    this.approverThreshold.set(update.newThreshold);

    this.emitEvent('thresholdUpdate', update);
  }

  @method
  updateDelegate(permit: Permit, update: DelegateUpdate) {
    let authDataHash = Poseidon.hash(DelegateUpdate.toFields(update));
    permit.authDataHash.assertEquals(
      authDataHash,
      'Permit and DelegateUpdate must be consistent'
    );

    this.account.nonce.assertEquals(update.contractNonce);
    this.self.publicKey.assertEquals(update.contractAddress);
    this.self.body.incrementNonce = Bool(true);

    this.approvePermitInternal(permit).assertTrue('Permit verification failed');
    AccountUpdate.setValue(this.self.update.delegate, update.newDelegate);

    this.emitEvent('delegateUpdate', update);
  }

  @method
  upgradeContract(permit: Permit, update: ContractUpdate) {
    let authDataHash = Poseidon.hash(ContractUpdate.toFields(update));
    permit.authDataHash.assertEquals(
      authDataHash,
      'Permit and ContractUpdate must be consistent'
    );

    this.account.nonce.assertEquals(update.contractNonce);
    this.self.publicKey.assertEquals(update.contractAddress);
    this.self.body.incrementNonce = Bool(true);

    this.approvePermitInternal(permit).assertTrue('Permit verification failed');
    AccountUpdate.setValue(this.self.update.verificationKey, update.vk);

    this.emitEvent('contractUpdate', update.toEvent());
  }
}
