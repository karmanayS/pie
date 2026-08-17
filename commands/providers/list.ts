import { Command } from 'commander';

export const listProvidersCommand = new Command("list")
    .description("Lists all available providers")
    .action(() => {
        const providers = ["prov1", "prov2", "prov3"]
        for (let i=0;i<providers.length;i++) {
            console.log(providers[i])
        }
    })