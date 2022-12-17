# Mina zkApp: zk-multi-sig

contract for MultiSig Wallet.

## How to integrate with third-party zkApps

For example, you can integrate authorization verification methods into zkOracles that require multi-signature wallet management:

```typescript
import { MultiSigZkapp } from "zk-multi-sig";

export class MyOracle extends SmartContract {

	@method
	updateOraclePublicKey(permit: Permit, newPublicKey: PublicKey) {
		const multiWallet = new MultiSigZkapp(walletAddress);
		multiWallet.approvePermit(permit).assertTrue();

		// Other logic
		....
	}
}
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
