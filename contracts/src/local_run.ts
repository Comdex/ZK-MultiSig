import {
  AccountUpdate,
  isReady,
  Mina,
  Permissions,
  Poseidon,
  PrivateKey,
  PublicKey,
  shutdown,
  Signature,
  UInt32,
} from 'snarkyjs';
import { ApproverHashes } from './models/contract_state';
import { Permit } from './models/permit';
import { ApproversUpdate } from './models/updates';

import { MultiSigZkapp } from './multi_sig_zkapp';

const proofsEnabled = true;

async function run() {
  await isReady;

  console.log('pri: ', PrivateKey.random().toBase58());

  const Local = Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(Local);
  let deployerAccount = Local.testAccounts[0].privateKey;
  let zkAppPrivateKey = PrivateKey.random();
  let zkAppAddress = zkAppPrivateKey.toPublicKey();
  let zkApp = new MultiSigZkapp(zkAppAddress);
  let approvers = [
    Local.testAccounts[1].publicKey,
    Local.testAccounts[2].publicKey,
    Local.testAccounts[3].publicKey,
  ];
  let approversKey = [
    Local.testAccounts[1].privateKey,
    Local.testAccounts[2].privateKey,
    Local.testAccounts[3].privateKey,
  ];
  let approverThreshold = UInt32.from(2);
  let testReceiver = Local.testAccounts[1].publicKey;

  console.log('start analyze');
  //analyze methods
  let result = MultiSigZkapp.analyzeMethods();
  console.log('MultiSignZkapp analyze result: ', result);

  if (proofsEnabled) {
    console.time('MultiSignZkapp compile');
    await MultiSigZkapp.compile();
    console.timeEnd('MultiSignZkapp compile');
  }

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
  console.log('deploy success');

  // let currentNonce = zkApp.account.nonce.get();
  // console.log('currentNonce: ', currentNonce.toString());
  // let au = {
  //   contractAddress: zkAppAddress,
  //   contractNonce: zkApp.account.nonce.get(),
  //   newThreshold: UInt32.from(3),
  // };
  // let permit = Permit.create(Poseidon.hash(ThresholdUpdate.toFields(au)));
  // let signFields = [permit.authDataHash];

  // permit.addSignWithPublicKey(
  //   Signature.create(approversKey[0], signFields),
  //   approvers[0]
  // );
  // permit.addSignWithPublicKey(
  //   Signature.create(approversKey[1], signFields),
  //   approvers[1]
  // );

  // permit.padding();

  // const txn2 = await Mina.transaction(deployerAccount, () => {
  //   zkApp.updateApproverThreshold(permit, au);
  // });
  // await txn2.prove();
  // if (proofsEnabled) {
  //   await txn2.send();
  // } else {
  //   await txn2.sign([zkAppPrivateKey]).send();
  // }

  // const threshold = zkApp.approverThreshold.get();
  // console.log('threshold: ', threshold.toString());
  // const newNonce = zkApp.account.nonce.get();
  // console.log('newNonce: ', newNonce.toString());

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

  const txn2 = await Mina.transaction(deployerAccount, () => {
    zkApp.updateApprovers(permit, au);
  });
  await txn2.prove();
  if (proofsEnabled) {
    await txn2.send();
  } else {
    await txn2.sign([zkAppPrivateKey]).send();
  }

  const approverHashes = zkApp.approverHashes.get();
  console.log('approverHashes: ', ApproverHashes.toJSON(approverHashes));
}

console.log('start run local');
await run();
shutdown();
console.log('end run local');
