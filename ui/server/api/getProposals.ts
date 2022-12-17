import { useDB } from "../db";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const contractAddress = query.contractAddress;

  const { ProposalModel } = useDB();
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
