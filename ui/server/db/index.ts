import { Nitro } from "nitropack";
import { Sequelize, Model, DataTypes } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./db.sqlite",
});

interface Proposal extends Model {
  id: number;
  contractAddress: string;
  contractNonce: number;
  desc: string;
  amount: string;
  receiver: string;
}

const ProposalModel = sequelize.define<Proposal>("Proposal", {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
  },
  contractAddress: {
    type: DataTypes.STRING,
  },
  contractNonce: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
  desc: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.STRING,
  },
  receiver: {
    type: DataTypes.STRING,
  },
});

interface ProposalSign extends Model {
  id: number;
  proposalId: number;
  publicKey58: string;
  sign: string;
}

const ProposalSignModel = sequelize.define<Proposal>("ProposalSign", {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
  },
  proposalId: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
  publicKey58: {
    type: DataTypes.STRING,
  },
  sign: {
    type: DataTypes.STRING,
  },
});
// await sequelize.sync();

export default (_nitroApp: Nitro) => {
  try {
    useDB();
    console.log("DB connection established.");
  } catch (err) {
    console.error("DB connection failed.", err);
  }
};

export const useDB = () => {
  return {
    ProposalModel,
    ProposalSignModel,
  };
};
