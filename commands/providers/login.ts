import { Command } from 'commander';
import { Models } from "@opencode-ai/models"

const client = Models.make()

export const loginCommand = new Command("login")
    .description('Lets user login into the provider (use it as default)')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .option('-a, --api_key <apiKey>', 'Your api key', '')
    .action(async({provider,api_key}) => {
        // const content = Bun.file("./commands/providers/auth.json")
        // const jsonData = await content.json()
        // const providersList = Object.keys(jsonData)
        const providers = await client.providers()
        const providersList = Object.keys(providers)
        const providerExists = providersList.includes(provider)
        if (!providerExists) {
            console.log("Invalid provider name, please go through the provider list and choose the correct provider")
            return
        } 
        // jsonData[provider]["key"] = api_key
        // await Bun.write("./commands/providers/auth.json",JSON.stringify(jsonData))
        
        let auth = Bun.file("./db/auth.json")
        // if (!(await auth.exists())) {
        //     console.log("Doesnt exist")
        //     await Bun.write("./db/auth.json",JSON.stringify({}))
        //     auth = Bun.file("./db/auth.json")
        // }
        let authJson;
        try {
            authJson = await auth.json()
        } catch(err) {
            console.log("Catch")
            await Bun.write("./db/auth.json",JSON.stringify({}))
            authJson = await auth.json()
        }
        authJson[provider] = api_key
        await Bun.write("./db/auth.json", JSON.stringify(authJson))
        
        // const state = Bun.file("./db/state.json")
        // const jsonState = await state.json()
        // jsonState["provider"] = provider
        // jsonState["model"] = ""
        // await Bun.write("./db/state.json", JSON.stringify(jsonState))     
        
        console.log(`Logged into ${provider} successfully!, Please use the "provider set" command to set the provider`)
    })
