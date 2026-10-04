import { Command } from 'commander';
import { Models } from "@opencode-ai/models"
import { readAppState, writeAppState } from '../../storage/state';

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
        const stateJson = await readAppState() ?? {
            provider: "",
            model: "",
        }
        stateJson["provider"] = provider
        stateJson["model"] = ""
        await writeAppState(stateJson)
        console.log("provider is set to " + provider)
    })
