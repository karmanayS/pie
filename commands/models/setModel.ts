import { Command } from "commander";
import { Models } from "@opencode-ai/models"

const client = Models.make()

export const setModelCommand = new Command("set")
    .description("Select a particular model to use")
    .option("-m, --model <model_name>","Name of the model","")
    .action(async({model}) => {
        const providers = await client.providers()
        const state = Bun.file("./state.json")
        const stateJson = await state.json()
        const selectedProvider = stateJson["provider"]
        const models = providers[selectedProvider]["models"]
        const modelsList = Object.keys(models)
        const isSupported = modelsList.includes(model)
        if (!isSupported) {
            console.log("This model is not supported by the selected provider, please select a supported model")
            return
        }
        stateJson["model"] = model
        await Bun.write("./state.json", JSON.stringify(stateJson))
        console.log(`Model set to ${model}`)
    })