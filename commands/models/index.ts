import { Command } from "commander";
import { modelsListCommand } from "./list";
import { setModelCommand } from "./setModel";

export const modelsCommand = new Command("models")
  .description('Models related information')
  .addCommand(modelsListCommand)
  .addCommand(setModelCommand)