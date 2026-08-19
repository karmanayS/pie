import { Command } from 'commander';

export const setProviderCommand = new Command("set")
    .description('Lets user set the default provider')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action(async({provider}) => {
        const content = Bun.file("./commands/providers/auth.json")
        const jsonData = await content.json()
        const providersList = Object.keys(jsonData)
        const isProvider = providersList.includes(provider)
        if (!isProvider) {
            console.log("Invalid provider name, please choose the right provider")
            return
        }
        const stateContent = Bun.file("./state.json")
        const stateJson = await stateContent.json()
        stateJson["provider"] = provider
        stateJson["model"] = ""
        await Bun.write("./state.json", JSON.stringify(stateJson))
        console.log("provider is set to " + provider)
    })
