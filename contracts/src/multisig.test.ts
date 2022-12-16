import { MultiSigZkapp } from './multi_sig_zkapp';
import { MultiSigZkappUpgrade } from './test_for_upgrade';
import {
  isReady,
  shutdown,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  UInt32,
  Poseidon,
  UInt64,
  Signature,
  Permissions,
  Field,
  Bool,
  VerificationKey,
} from 'snarkyjs';
import { Proposal, ProposalWithSigns } from './models/proposal';
import { ApproverHashes } from './models/contract_state';
import { jest } from '@jest/globals';
import { Permit } from './models/permit';
import { ThresholdUpdate, ApproversUpdate } from './models/updates';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = true;

describe('MultiSignZkapp', () => {
  let deployerAccount: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: MultiSigZkapp,
    approvers: PublicKey[],
    approversKey: PrivateKey[],
    approverThreshold: UInt32,
    testReceiver: PublicKey;

  beforeAll(async () => {
    await isReady;
    if (proofsEnabled) {
      await MultiSigZkapp.compile();
      // await MultiSignZkappUpgrade.compile();
    }
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    deployerAccount = Local.testAccounts[0].privateKey;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new MultiSigZkapp(zkAppAddress);
    approvers = [
      Local.testAccounts[1].publicKey,
      Local.testAccounts[2].publicKey,
      Local.testAccounts[3].publicKey,
    ];
    approversKey = [
      Local.testAccounts[1].privateKey,
      Local.testAccounts[2].privateKey,
      Local.testAccounts[3].privateKey,
    ];
    approverThreshold = UInt32.from(2);
    testReceiver = Local.testAccounts[1].publicKey;
  });

  afterAll(() => {
    // `shutdown()` internally calls `process.exit()` which will exit the running Jest process early.
    // Specifying a timeout of 0 is a workaround to defer `shutdown()` until Jest is done running all tests.
    // This should be fixed with https://github.com/MinaProtocol/mina/issues/10943
    setTimeout(shutdown, 0);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      AccountUpdate.createSigned(deployerAccount).send({
        to: zkAppAddress,
        amount: 2_000_000_000,
      });
      zkApp.deploy({ approvers, approverThreshold, zkappKey: zkAppPrivateKey });
      zkApp.setPermissions({
        ...Permissions.default(),
        editState: Permissions.proofOrSignature(),
        send: Permissions.proofOrSignature(),
        incrementNonce: Permissions.proofOrSignature(),
        setVerificationKey: Permissions.proofOrSignature(),
      });
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([zkAppPrivateKey]).send();
  }

  it('generates and deploys the `MutliSignZkapp` smart contract', async () => {
    await localDeploy();
    const approverHashes = zkApp.approverHashes.get();
    expect(approverHashes).toEqual(ApproverHashes.createWithPadding(approvers));
    const approverThresholdInZkapp = zkApp.approverThreshold.get();
    expect(approverThresholdInZkapp).toEqual(approverThreshold);
  });

  it('correctly send assets', async () => {
    await localDeploy();

    let proposalWithSigns = ProposalWithSigns.create(
      Proposal.create({
        contractAddress: zkAppAddress,
        contractNonce: zkApp.account.nonce.get(),
        desc: 'test proposal',
        amount: UInt64.from(100000),
        receiver: testReceiver,
      })
    );
    let signFields = Proposal.toFields(proposalWithSigns.proposal);
    let proposalHash = Poseidon.hash(signFields);
    proposalWithSigns.addSignWithPublicKey(
      Signature.create(approversKey[0], signFields),
      approvers[0]
    );
    proposalWithSigns.addSignWithPublicKey(
      Signature.create(approversKey[1], signFields),
      approvers[1]
    );

    proposalWithSigns.padding();
    // send assets transaction
    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.sendAssets(proposalWithSigns);
    });
    await txn.prove();

    if (proofsEnabled) {
      await txn.send();
    } else {
      await txn.sign([zkAppPrivateKey]).send();
    }

    const latestProposalHash = zkApp.latestProposalHash.get();
    expect(latestProposalHash).toEqual(proposalHash);
  });

  it('correctly approve permit', async () => {
    await localDeploy();

    let permit = Permit.create(Poseidon.hash([Field(888)]));
    let signFields = [permit.authDataHash];

    permit.addSignWithPublicKey(
      Signature.create(approversKey[0], signFields),
      approvers[0]
    );
    permit.addSignWithPublicKey(
      Signature.create(approversKey[1], signFields),
      approvers[1]
    );

    permit.padding();

    let ok = Bool(false);
    // test permit result
    const txn = await Mina.transaction(deployerAccount, () => {
      ok = zkApp.approvePermit(permit);
    });
    await txn.prove();

    if (proofsEnabled) {
      await txn.send();
    } else {
      await txn.sign([zkAppPrivateKey]).send();
    }

    expect(ok).toEqual(Bool(true));
  });

  it('Properly prevent approval of Permits that do not meet the signature threshold amount', async () => {
    await localDeploy();

    let permit = Permit.create(Poseidon.hash([Field(888)]));
    let signFields = [permit.authDataHash];

    permit.addSignWithPublicKey(
      Signature.create(approversKey[0], signFields),
      approvers[0]
    );

    permit.padding();

    let ok = Bool(false);
    // test permit result
    const txn = await Mina.transaction(deployerAccount, () => {
      ok = zkApp.approvePermit(permit);
    });
    await txn.prove();

    if (proofsEnabled) {
      await txn.send();
    } else {
      await txn.sign([zkAppPrivateKey]).send();
    }

    expect(ok).toEqual(Bool(false));
  });

  it('correctly update approverThreshold', async () => {
    await localDeploy();

    let currentNonce = zkApp.account.nonce.get();
    let au = {
      contractAddress: zkAppAddress,
      contractNonce: currentNonce,
      newThreshold: UInt32.from(3),
    };
    let permit = Permit.create(Poseidon.hash(ThresholdUpdate.toFields(au)));
    let signFields = [permit.authDataHash];

    permit.addSignWithPublicKey(
      Signature.create(approversKey[0], signFields),
      approvers[0]
    );
    permit.addSignWithPublicKey(
      Signature.create(approversKey[1], signFields),
      approvers[1]
    );

    permit.padding();

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.updateApproverThreshold(permit, au);
    });
    await txn.prove();
    if (proofsEnabled) {
      await txn.send();
    } else {
      await txn.sign([zkAppPrivateKey]).send();
    }

    const threshold = zkApp.approverThreshold.get();
    expect(threshold).toEqual(au.newThreshold);
  });

  it('correctly update updateApprovers', async () => {
    await localDeploy();

    let currentNonce = zkApp.account.nonce.get();
    let au = new ApproversUpdate({
      contractAddress: zkAppAddress,
      contractNonce: currentNonce,
      approvers: [
        PrivateKey.random().toPublicKey(),
        PrivateKey.random().toPublicKey(),
        PrivateKey.random().toPublicKey(),
      ],
    });
    let originApprovers = au.approvers.slice();
    au.padding();

    let permit = Permit.create(Poseidon.hash(ApproversUpdate.toFields(au)));
    let signFields = [permit.authDataHash];

    permit.addSignWithPublicKey(
      Signature.create(approversKey[0], signFields),
      approvers[0]
    );
    permit.addSignWithPublicKey(
      Signature.create(approversKey[1], signFields),
      approvers[1]
    );

    permit.padding();

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.updateApprovers(permit, au);
    });
    await txn.prove();
    if (proofsEnabled) {
      await txn.send();
    } else {
      await txn.sign([zkAppPrivateKey]).send();
    }

    const approverHashes = zkApp.approverHashes.get();
    expect(approverHashes).toEqual(
      ApproverHashes.createWithPadding(originApprovers)
    );
  });

  // it('correctly upgrade contract', async () => {
  //   await localDeploy();

  //   let newVk = MultiSignZkappUpgrade._verificationKey;
  //   let cu = ContractUpdate.create({
  //     contractAddress: zkAppAddress,
  //     contractNonce: zkApp.account.nonce.get(),
  //     reason: 'test update',
  //     vk: newVk as VerificationKey,
  //   });
  //   let permit = Permit.create(Poseidon.hash(ContractUpdate.toFields(cu)));
  //   let signFields = [permit.authDataHash];

  //   permit.addSignWithPublicKey(
  //     Signature.create(approversKey[0], signFields),
  //     approvers[0]
  //   );
  //   permit.addSignWithPublicKey(
  //     Signature.create(approversKey[1], signFields),
  //     approvers[1]
  //   );

  //   permit.padding();

  //   const txn = await Mina.transaction(deployerAccount, () => {
  //     zkApp.upgradeContract(permit, cu);
  //   });
  //   await txn.prove();

  //   if (proofsEnabled) {
  //     await txn.send();
  //   } else {
  //     await txn.sign([zkAppPrivateKey]).send();
  //   }

  // });
});
