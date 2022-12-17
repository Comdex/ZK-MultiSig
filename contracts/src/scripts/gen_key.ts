import { PrivateKey, isReady, shutdown, PublicKey, Poseidon } from 'snarkyjs';

await isReady;

// let privateKey = PrivateKey.random();
// let publicKey = privateKey.toPublicKey();

// console.log('private key:', privateKey.toBase58());
// console.log('public key:', publicKey.toBase58());

let p = PublicKey.fromBase58(
  'B62qpD4T3GcYSNmWUN3g8GVnXLyDECEEaCJ6owtZAbFDPA1zZUBrnKd'
);
let f = Poseidon.hash(p.toFields());
console.log('f hash: ', f.toString());

await shutdown();
