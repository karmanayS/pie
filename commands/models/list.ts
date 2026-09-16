import { Command } from "commander";
import { Models } from "@opencode-ai/models"

const client = Models.make()

export const modelsListCommand = new Command("list")
  .description('Returns all the models supported by the selected provider')
  .action(async() => {
    const providers = await client.providers()
    const state = Bun.file("./db/state.json")
    if (!(await state.exists())) {
      console.log(`select a provdier first to see the models supported by that provider, checkout the "providers set" command`)
      return
    }
    let stateJson;
    try {
      stateJson = await state.json()
    } catch(err) {
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