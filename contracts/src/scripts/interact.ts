import {
  isReady,
  Mina,
  Poseidon,
  PrivateKey,
  PublicKey,
  shutdown,
  Signature,
  UInt32,
  UInt64,
  VerificationKey,
} from 'snarkyjs';
import fs from 'fs/promises';
import { MultiSigZkapp } from '../multi_sig_zkapp';
import {
  accountExists,
  loopUntilAccountExists,
  makeAndSendTransaction,
  mina2Nano,
} from './utils';
import { deploy } from './deploy';
import { ContractUpdate, DelegateUpdate } from '../models/updates';
import { Permit } from '../models/permit';
import { Proposal, ProposalWithSigns } from '../models/proposal';

// check command line arg
let network = process.argv[2];
if (!network) {
  network = 'berkeley';
  console.log('use default network: berkeley');
}

Error.stackTraceLimit = 1000;

// parse config and private key from file
type Config = { networks: Record<string, { url: string; keyPath: string }> };
let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
let config = configJson.networks[network];
let key: {
  privateKey: string;
  feePayerPrivateKey: string;
  approver0PrivateKey: string;
  approver1PrivateKey: string;
  approver2PrivateKey: string;
} = JSON.parse(await fs.readFile(config.keyPath, 'utf8'));

await isReady;
console.log('SnarkyJS loaded');

const feePayerPrivateKey = PrivateKey.fromBase58(key.feePayerPrivateKey);
const feePayerPublicKey = feePayerPrivateKey.toPublicKey();
const approver0PrivateKey = PrivateKey.fromBase58(key.approver0PrivateKey);
const approver0PublicKey = approver0PrivateKey.toPublicKey();
const approver1PrivateKey = PrivateKey.fromBase58(key.approver1PrivateKey);
const approver1PublicKey = approver1PrivateKey.toPublicKey();
const approver2PrivateKey = PrivateKey.fromBase58(key.approver2PrivateKey);
const approver2PublicKey = approver2PrivateKey.toPublicKey();
const zkAppKey = PrivateKey.fromBase58(key.privateKey);

let transactionFee = 100_000_000;
let approverThreshold = UInt32.from(2);

// set up Mina instance and contract we interact with
const Network = Mina.Network(config.url);
Mina.setActiveInstance(Network);
let zkAppAddress = zkAppKey.toPublicKey();

// check feePayer account
let account = await loopUntilAccountExists({
  account: feePayerPublicKey,
  eachTimeNotExist: () => {
    console.log(
      'Deployer account does not exist. ' +
        'Request funds at faucet ' +
        'https://faucet.minaprotocol.com/?address=' +
        feePayerPublicKey.toBase58()
    );
  },
  isZkAppAccount: false,
});

console.log(
  `Using fee payer account with nonce ${account.nonce}, balance ${account.balance}`
);

// compile contract
console.log('Compiling smart contract...');
console.time('compile MultiSigZkapp');
let { verificationKey } = await MultiSigZkapp.compile();
console.timeEnd('compile MultiSigZkapp');

let zkApp = new MultiSigZkapp(zkAppAddress);

const accountExistsAlready = await accountExists(zkAppAddress, true);

if (!accountExistsAlready) {
  // Programmatic deploy:
  //   Besides the CLI, you can also create accounts programmatically. This is useful if you need
  //   more custom account creation - say deploying a zkApp to a different key than the fee payer
  //   key, programmatically parameterizing a zkApp before initializing it, or creating Smart
  //   Contracts programmatically for users as part of an application.
  await deploy(
    feePayerPrivateKey,
    zkAppKey,
    zkAppAddress,
    zkApp,
    verificationKey,
    [approver0PublicKey, approver1PublicKey, approver2PublicKey],
    approverThreshold
  );
}

let zkAppAccount = await loopUntilAccountExists({
  account: zkAppAddress,
  eachTimeNotExist: () =>
    console.log('waiting for zkApp account to be deployed...'),
  isZkAppAccount: true,
});

let currentThreshold = zkApp.approverThreshold.get();
console.log(
  'current value of approverThreshold is ',
  currentThreshold.toString()
);

async function sendAssets() {
  let testReceiver = PublicKey.fromBase58(
    'B62qqCgQVm18rFCjgkUoSg7Yg97krwfe2Hz2fqhDixVyUqigR6vVtpK'
  );
  let proposalWithSigns = ProposalWithSigns.create(
    Proposal.create({
      contractAddress: zkAppAddress,
      contractNonce: zkApp.account.nonce.get(),
      desc: 'test proposal',
      amount: UInt64.from(mina2Nano(8)),
      receiver: testReceiver,
    })
  );
  let signFields = Proposal.toFields(proposalWithSigns.proposal);
  let proposalHash = Poseidon.hash(signFields);
  proposalWithSigns.addSignWithPublicKey(
    Signature.create(approver0PrivateKey, signFields),
    approver0PublicKey
  );
  proposalWithSigns.addSignWithPublicKey(
    Signature.create(approver2PrivateKey, signFields),
    approver2PublicKey
  );

  proposalWithSigns.padding();

  await makeAndSendTransaction({
    feePayerPrivateKey,
    zkAppPublicKey: zkAppAddress,
    mutateZkApp: () => zkApp.sendAssets(proposalWithSigns),
    transactionFee: transactionFee,
    getState: () => zkApp.account.nonce.get(),
    statesEqual: (num1, num2) => num1.equals(num2).toBoolean(),
  });

  const latestProposalHash = zkApp.latestProposalHash.get();
  console.log('onchain-latestProposalHash: ', latestProposalHash.toString());
  console.log('proposalHash: ', proposalHash.toString());
}

async function updateDelegate() {
  console.log('update delegate begin');
  let newDelegate = PublicKey.fromBase58(
    'B62qqCgQVm18rFCjgkUoSg7Yg97krwfe2Hz2fqhDixVyUqigR6vVtpK'
  );
  let du = {
    contractAddress: zkAppAddress,
    contractNonce: zkApp.account.nonce.get(),
    newDelegate,
  };

  let permit = Permit.create(Poseidon.hash(DelegateUpdate.toFields(du)));
  let signFields = [permit.authDataHash];

  permit.addSignWithPublicKey(
    Signature.create(approver1PrivateKey, signFields),
    approver1PublicKey
  );
  permit.addSignWithPublicKey(
    Signature.create(approver2PrivateKey, signFields),
    approver2PublicKey
  );
  permit.padding();

  // await makeAndSendTransaction({
  //   feePayerPrivateKey,
  //   zkAppPublicKey: zkAppAddress,
  //   mutateZkApp: () => zkApp.updateDelegate(permit, du),
  //   transactionFee: transactionFee,
  //   getState: () => zkApp.account.nonce.get(),
  //   statesEqual: (num1, num2) => num1.equals(num2).toBoolean(),
  // });
}

await updateDelegate();
//await sendAssets();

console.log('Shutting down');
shutdown();
