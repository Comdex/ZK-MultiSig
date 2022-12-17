export type WalletConfJSON = {
  walletName: string | null;
  walletAddress: string;
  owners: { name: string | null; address: string }[];
};

export type Proposal = {
  id: number;
  desc: string;
  amount: number;
  receiver: string;
  contractAddress: string;
  contractNonce: number;
  signedNum: number;
};

export type ProposalSign = {
  id: number;
  proposalId: number;
  publicKey58: string;
  sign: string;
};
