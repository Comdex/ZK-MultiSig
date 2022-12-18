import { useDB } from "../db";

const { ProposalModel } = useDB();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const contractAddress = query.contractAddress;

  try {
    let ps = await ProposalModel.findAll({ where: { contractAddress } });
    console.log("proposals: ", ps.length);
    return {
      code: 200,
      data: ps,
    };
  } catch (err) {
    console.log(err);

    return {
      code: 500,
      data: null,
    };
  }
});
