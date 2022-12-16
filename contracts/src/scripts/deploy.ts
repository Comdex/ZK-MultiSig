import { MultiSigZkapp } from '../multi_sig_zkapp';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  fetchAccount,
  UInt32,
} from 'snarkyjs';

let transactionFee = 100_000_000;

export const deploy = async (
  deployerPrivateKey: PrivateKey,
  zkAppPrivateKey: PrivateKey,
  zkAppPublicKey: PublicKey,
  zkapp: MultiSigZkapp,
  verificationKey: { data: string; hash: string | Field },
  approvers: PublicKey[],
  approverThreshold: UInt32
) => {
  console.log(
    'using deployer private key with public key',
    deployerPrivateKey.toPublicKey().toBase58()
  );
  console.log(
    'using zkApp private key with public key',
    zkAppPrivateKey.toPublicKey().toBase58()
  );

  // ----------------------------------------------------

  let zkAppResponse = await fetchAccount({ publicKey: zkAppPublicKey });
  let isDeployed =
    zkAppResponse.error == null && zkAppResponse.account!.appState != null;
  let noNeedToFundAccount =
    zkAppResponse.error == null && zkAppResponse.account!.appState == null;
  // TODO add check that verification key is correct once this is available in SnarkyJS

  // ----------------------------------------------------

  if (isDeployed) {
    console.log(
      'zkApp for public key',
      zkAppPublicKey.toBase58(),
      'found deployed'
    );
  } else {
    console.log('Deploying zkapp for public key', zkAppPublicKey.toBase58());
    let transaction = await Mina.transaction(
      { feePayerKey: deployerPrivateKey, fee: transactionFee },
      () => {
        if (!noNeedToFundAccount) {
          AccountUpdate.fundNewAccount(deployerPrivateKey);
        }

        zkapp.deploy({
          zkappKey: zkAppPrivateKey,
          verificationKey,
          approvers,
          approverThreshold,
        });
      }
    );

    console.log('Sending the deploy transaction...');
    const res = await transaction.send();
    const hash = await res.hash(); // This will change in a future version of SnarkyJS
    if (hash == null) {
      console.log('error sending transaction (see above)');
    } else {
      console.log(
        'See deploy transaction at',
        'https://berkeley.minaexplorer.com/transaction/' + hash
      );
    }
  }

  // ----------------------------------------------------

  return isDeployed;
};
