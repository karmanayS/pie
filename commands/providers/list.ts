import { Command } from 'commander';

export const listProvidersCommand = new Command("list")
    .description("Lists all available providers")
    .action(async() => {
        const content = await Bun.file("./commands/providers/auth.json")
        const jsonData = await content.json()
        const providerList = Object.keys(jsonData)
        for (let i=0;i<providerList.length;i++) {
            console.log(providerList[i])
        }
    })