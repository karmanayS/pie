import { Command } from "commander";
import { Models } from "@opencode-ai/models"
import { readAppState } from "../../storage/state";

const client = Models.make()

export const modelsListCommand = new Command("list")
  .description('Returns all the models supported by the selected provider')
  .action(async() => {
    const providers = await client.providers()
    const stateJson = await readAppState()
    if (!stateJson) {
      console.log(`select a provider first to see the models supported by that provider, checkout the "providers set" command`)
      return
    }
    const selectedProvider = stateJson.provider 
    const models = providers[selectedProvider]["models"]
    const modelsList = Object.keys(models)
    for (let i=0;i<modelsList.length;i++) {
      if (modelsList[i] === stateJson.model) {
        console.log(modelsList[i] + " (selected)")
        continue
      }
      console.log(modelsList[i])  
    }
});
