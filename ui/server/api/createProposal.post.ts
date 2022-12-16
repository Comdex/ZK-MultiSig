import { useDB } from "../db";

type ProposalValue = {
  contractAddress: string;
  contractNonce: number;
  desc: string;
  amount: string;
  receiver: string;
};

export default defineEventHandler(async (event) => {
  const proposalValue: ProposalValue = await readBody(event);

  const { ProposalModel } = useDB();
  let p = await ProposalModel.create(proposalValue);
  if (p == null) {
    return "failed";
  }
  return "success";
});
