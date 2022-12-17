import { useDB } from "../db";

export default defineEventHandler(async (event) => {
  const proposalValue = await readBody(event);

  const { ProposalModel } = useDB();
  let p = await ProposalModel.create(proposalValue);
  console.log("proposal result: ", p.toJSON());
  if (p == null) {
    return "failed";
  }
  return "success";
});
