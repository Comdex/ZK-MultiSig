import { useDB } from "../db";
import { Identifier } from "sequelize";

export default defineEventHandler(async (event) => {
  const value = await readBody(event);

  const { ProposalSignModel, ProposalModel } = useDB();

  try {
    let sign = await ProposalSignModel.create(value);
    if (sign == null) {
      return "failed";
    }

    let pId = value.proposalId as Identifier;
    let p = await ProposalModel.findByPk(pId);
    if (p == null) {
      return "failed";
    }

    p.increment("signedNum");
    return "success";
  } catch (err) {
    console.log(err);
    return "failed";
  }
});
