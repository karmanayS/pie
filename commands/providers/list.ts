import { Command } from 'commander';
import { providersList } from '.';

export const listProvidersCommand = new Command("list")
    .description("Lists all available providers")
    .action(() => {
        console.log(providersList)
    })