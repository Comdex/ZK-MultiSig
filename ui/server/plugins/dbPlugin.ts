import { Nitro } from "nitropack";
import { sequelize } from "../db";

export default async (_nitroApp: Nitro) => {
  try {
    await sequelize.sync();
    console.log("DB connection established.");
  } catch (err) {
    console.error("DB connection failed.", err);
  }
};
