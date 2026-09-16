
import { Command } from 'commander';

export const logoutCommand = new Command("logout")
    .description('Lets user logout from the provider')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action(async({provider}) => {
        const content = Bun.file("./db/auth.json")
        const jsonData = await content.json()
        jsonData[provider]["key"] = ""
        await Bun.write("./db/auth.json",JSON.stringify(jsonData))
        console.log(`Logged out of ${provider} successfully!`)  
    })

