import { Command } from "commander";
import { Models } from "@opencode-ai/models"

const client = Models.make()

export const modelsListCommand = new Command("list")
  .description('Returns all the models supported by the selected provider')
  .action(async() => {
    const providers = await client.providers()
    const state = Bun.file("./state.json")
    const stateJson = await state.json()
    const selectedProvider = stateJson.provider 
    const models = providers[selectedProvider]["models"]
    const modelsList = Object.keys(models)
    for (let i=0;i<modelsList.length;i++) {
        console.log(modelsList[i])
    }
});