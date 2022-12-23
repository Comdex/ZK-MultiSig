import { useDB } from "../db";

const { ProposalSignModel } = useDB();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const proposalId = query.proposalId;
  const publicKey58 = query.publicKey58;

  try {
    let signs = await ProposalSignModel.findAll({
      where: { proposalId, publicKey58 },
    });

    if (signs && signs.length > 0) {
      return {
        code: 200,
        data: {
          isSigned: true,
        },
      };
    } else {
      return {
        code: 200,
        data: {
          isSigned: false,
        },
      };
    }
  } catch (err) {
    console.log(err);

    return {
      code: 500,
      data: null,
    };
  }
});
