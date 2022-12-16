import {
  Field,
  SmartContract,
  state,
  State,
  method,
  UInt32,
  Permissions,
  PublicKey,
  Bool,
  PrivateKey,
} from 'snarkyjs';
import { ApproverHashes } from './models/contract_state';
import { Permit } from './models/permit';

export class MultiSigZkappUpgrade extends SmartContract {
  @state(ApproverHashes as any) approverHashes = State<ApproverHashes>();
  @state(UInt32) approverThreshold = State<UInt32>();
  @state(Field) latestProposalHash = State<Field>();

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
  }

  init() {
    super.init();
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proof(),
      send: Permissions.proof(),
      incrementNonce: Permissions.proof(),
      setVerificationKey: Permissions.proof(),
    });
  }

  @method
  approvePermit(permit: Permit): Bool {
    let approverHashes = this.approverHashes.get();
    this.approverHashes.assertEquals(approverHashes);

    let approverThreshold = this.approverThreshold.get();
    this.approverThreshold.assertEquals(approverThreshold);

    return permit.verify(approverHashes, approverThreshold);
  }
}
