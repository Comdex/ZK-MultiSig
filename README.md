# ZK-MultiSig Wallet

## Use your zk multi-sig wallet to connect to Mina zkApps

A zk multi-signature contract wallet, which can be freely created and set by users with different parameters, and supports third-party zkApps integrated authorization verification, which is suitable for zkApp contracts that require multi-signature trust management (such as zkOracle contracts jointly managed by trusted groups or individuals).

## Features

- Send assets through multi-signature authorization
- Update all approvers
- Update the threshold for contract approval authorization
- Update wallet staking delegation
- Wallet contracts can be safely upgraded
- Support third-party zkApps integrated wallet contract for authorization

The Project consists of the following sub projects.

- **contracts** - multi-signature wallet contract built with snarkyjs.
- **ui** - the frontend and backend server of the zkApp built with nuxt3.

The very early version is available at https://multisig.zkapps.xyz

Please note that the current version of the UI only supports displaying some features of the multi-signature wallet contract, which is still under development.
