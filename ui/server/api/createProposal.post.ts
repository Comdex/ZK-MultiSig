import { useDB } from "../db";

const { ProposalModel } = useDB();

export default defineEventHandler(async (event) => {
  const proposalValue = await readBody(event);

  let p = await ProposalModel.create(proposalValue);
  console.log("proposal result: ", p.toJSON());
  if (p == null) {
    return "failed";
  }
  return "success";
});
