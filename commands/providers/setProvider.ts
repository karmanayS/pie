import { Command } from 'commander';
import { Models } from "@opencode-ai/models"

const client = Models.make()

export const setProviderCommand = new Command("set")
    .description('Lets user choose a provider of their choice, chosen provider should be logged in')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action(async({provider}) => {
        const providers = await client.providers()
        const providersList = Object.keys(providers)
        const includes = providersList.includes(provider)
        if (!includes) {
            console.log(`The provider ${provider} doesnt exist, please check the name of the provider`)
            return 
        }
        const state = Bun.file("./db/state.json")
        if (!(await state.exists())) {
            await Bun.write("./db/state.json",JSON.stringify({}))
        }
        let stateJson;
        try {
            stateJson = await state.json()
        } catch (error) {
            await Bun.write("./db/state.json",JSON.stringify({}))
            stateJson = await state.json()
        }
        stateJson["provider"] = provider
        stateJson["model"] = ""
        // const auth = Bun.file("./db/auth.json")
        // const jsonAuth = await auth.json()
        // const loggedInProviders = Object.keys(jsonAuth)
        // const isProvider = loggedInProviders.includes(provider)
        // if (!isProvider) {
        //     console.log(`Please log into the ${provider} or check if the provider name is correct from the providers list`)
        //     return
        // }
        // const stateContent = Bun.file("./db/state.json")
        // const stateJson = await stateContent.json()
        // stateJson["provider"] = provider
        // stateJson["model"] = ""
        await Bun.write("./db/state.json", JSON.stringify(stateJson))
        console.log("provider is set to " + provider)
    })
