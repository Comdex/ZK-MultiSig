import { Identifier } from "sequelize";
import { useDB } from "../db";

const { ProposalModel, ProposalSignModel } = useDB();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const proposalId = query.proposalId as Identifier;

  try {
    let proposal = await ProposalModel.findByPk(proposalId);
    console.log("proposal: ", proposal?.toJSON());

    let signs = await ProposalSignModel.findAll({
      where: { proposalId },
    });
    return {
      code: 200,
      data: {
        proposal,
        signs,
      },
    };
  } catch (err) {
    console.log(err);

    return {
      code: 500,
      data: null,
    };
  }
});
