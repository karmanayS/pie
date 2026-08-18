import { Command } from 'commander';
import { providersList } from '.';

export const setProviderCommand = new Command("set")
    .description('Lets user set the default provider')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action(({provider}) => {
        const isProvider = providersList.includes(provider)
        if (!isProvider) {
            console.log("Invalid provider name, please choose the right provider")
        }
        // have an isSelected field add to the auth.json and make it selected true for the model the user gives and based on that we will also give the models list for that provider and we also need to store the selected model state somewhere
        console.log("provider is set to" + provider)
    })
