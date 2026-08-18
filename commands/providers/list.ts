import { Command } from 'commander';
import { Models } from "@opencode-ai/models"

const client = Models.make()

export const listProvidersCommand = new Command("list")
    .description("Lists all available providers")
    .action(async() => {
        const providers = await client.providers()
        const providersList = Object.keys(providers)
        for (let i=0;i<providersList.length;i++) {
            console.log(providersList[i])
        }
    })