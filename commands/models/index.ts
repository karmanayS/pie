import { Command } from "commander";
import { modelsListCommand } from "./list";

export const modelsCommand = new Command("models")
  .description('Models related information')
  .addCommand(modelsListCommand)