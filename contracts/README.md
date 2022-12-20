# Mina zkApp: zk-multi-sig

contract for MultiSig Wallet.

## How to integrate with third-party zkApps

For example, you can integrate authorization verification methods into zkOracles that require multi-signature wallet management:

```typescript
import { MultiSigZkapp } from "zk-multi-sig";

export class MyOracle extends SmartContract {

	// Note that you need to deal with signed data replay attacks yourself
	@method
	updateOraclePublicKey(permit: Permit, newPublicKey: PublicKey) {
		const multiWallet = new MultiSigZkapp(walletAddress);
		multiWallet.approvePermit(permit).assertTrue();

		// Other logic
		....
	}
}
```

## How can a third-party developer manually create a permit

```typescript
class MyData extends Struct({ id: Field, amount: UInt64 }) {}
// Data that requires authorization
const dataForAuth = { id: Field(1), amount: UInt64.from(1000000) };
// Generate hash
const dataHash = Poseidon.hash(Mydata.toFields(dataForAuth));
const permit = Permit.create(dataHash);
// Add some signatures. Note that the signature is a signature to the data hash,
// not the data itself.
permit.addSignWithPublicKey(signature1, signerPublicKey1);
permit.addSignWithPublicKey(signature2, signerPublicKey2);
```

## How to build

```sh
npm run build
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## License

[Apache-2.0](LICENSE)
