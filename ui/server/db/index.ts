import { Sequelize, Model, DataTypes } from "sequelize";

const runtimeConfig = useRuntimeConfig();

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: runtimeConfig.dbPath,
});

interface Proposal extends Model {
  id: number;
  contractAddress: string;
  contractNonce: number;
  desc: string;
  amount: string;
  receiver: string;
  signedNum: number;
}

const ProposalModel = sequelize.define<Proposal>("Proposal", {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER.UNSIGNED,
  },
  contractAddress: {
    type: DataTypes.TEXT,
  },
  contractNonce: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
  desc: {
    type: DataTypes.TEXT,
  },
  amount: {
    type: DataTypes.STRING,
  },
  receiver: {
    type: DataTypes.TEXT,
  },
  signedNum: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
  },
});

interface ProposalSign extends Model {
  id: number;
  proposalId: number;
  publicKey58: string;
  sign: string;
}

const ProposalSignModel = sequelize.define<ProposalSign>("ProposalSign", {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER.UNSIGNED,
  },
  proposalId: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
  publicKey58: {
    type: DataTypes.TEXT,
  },
  sign: {
    type: DataTypes.TEXT,
  },
});

export const useDB = () => {
  return {
    ProposalModel,
    ProposalSignModel,
  };
};
