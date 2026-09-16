import { Command } from 'commander';

export const setProviderCommand = new Command("set")
    .description('Lets user choose a provider of their choice, chosen provider should be logged in')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action(async({provider}) => {
        const auth = Bun.file("./db/auth.json")
        const jsonAuth = await auth.json()
        const loggedInProviders = Object.keys(jsonAuth)
        const isProvider = loggedInProviders.includes(provider)
        if (!isProvider) {
            console.log(`Please log into the ${provider} or check if the provider name is correct from the providers list`)
            return
        }
        const stateContent = Bun.file("./db/state.json")
        const stateJson = await stateContent.json()
        stateJson["provider"] = provider
        stateJson["model"] = ""
        await Bun.write("./db/state.json", JSON.stringify(stateJson))
        console.log("provider is set to " + provider)
    })
