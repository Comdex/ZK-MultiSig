import { Identifier } from "sequelize";
import { useDB } from "../db";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const proposalId = query.proposalId as Identifier;

  const { ProposalModel } = useDB();
  try {
    let p = await ProposalModel.findByPk(proposalId);
    console.log("proposal: ", p?.toJSON());

    return {
      code: 200,
      data: p,
    };
  } catch (err) {
    console.log(err);

    return {
      code: 500,
      data: null,
    };
  }
});
