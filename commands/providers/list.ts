import { Command } from 'commander';
import { Models } from "@opencode-ai/models"

const client = Models.make()

export const listProvidersCommand = new Command("list")
    .description("Lists all available providers")
    .action(async() => {
        const providers = await client.providers()
        const providersList = Object.keys(providers)
        // const content = await Bun.file("./commands/providers/auth.json")
        // const jsonData = await content.json()
        // const providerList = Object.keys(jsonData)
        for (let i=0;i<providersList.length;i++) {
            console.log(providersList[i])
        }
    })