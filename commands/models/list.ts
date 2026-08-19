import { Command } from "commander";
import { Models } from "@opencode-ai/models"

const client = Models.make()

export const modelsListCommand = new Command("list")
  .description('Returns all the models supported by the selected provider')
  .action(async() => {
    const providers = await client.providers()
    console.log(providers)
});