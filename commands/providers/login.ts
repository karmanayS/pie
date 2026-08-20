import { Command } from 'commander';

export const loginCommand = new Command("login")
    .description('Lets user login into the provider (use it as default)')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .option('-a, --api_key <apiKey>', 'Your api key', '')
    .action(async({provider,api_key}) => {
        const content = Bun.file("./commands/providers/auth.json")
        const jsonData = await content.json()
        const providersList = Object.keys(jsonData)
        const providerExists = providersList.includes(provider)
        if (!providerExists) {
            console.log("Invalid provider name, please go through the provider list and choose the correct provider")
            return
        } 
        jsonData[provider]["key"] = api_key
        await Bun.write("./commands/providers/auth.json",JSON.stringify(jsonData))
        
        const state = Bun.file("./state.json")
        const jsonState = await state.json()
        jsonState["provider"] = provider
        jsonState["model"] = ""
        await Bun.write("./state.json", JSON.stringify(jsonState))     
        
        console.log(`Logged into ${provider} successfully!`)
    })
