import { Command } from 'commander';
import { providersList } from './list';

export const loginCommand = new Command("login")
    .description('Lets user login into the provider (use it as default)')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .option('-a, --api_key <apiKey>', 'Your api key', '')
    .action(async({provider,api_key}) => {
        const providerExists = providersList.includes(provider)
        if (!providerExists) {
            console.log("Invalid provider name, please go through the provider list and choose the correct provider")
            return
        }
        await Bun.write("./commands/providers")       
    })
