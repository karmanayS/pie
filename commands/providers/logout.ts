
import { Command } from 'commander';

export const logoutCommand = new Command("logout")
    .description('Lets user logout from the provider')
    .option('-p, --provider <providerName>', 'Name of the provider (gemini, claude etc)', '')
    .action(async({provider}) => {
        const content = Bun.file("./db/auth.json")
        if (!(await content.exists())) {
            console.log(`You are not logged into the ${provider} provider, cant logout`)
            return
        }
        let jsonData;
        try {
            jsonData = await content.json()
        } catch(err) {
            console.log("Error: You need to be logged into the provider to be able to logout")
            return
        }    
        const providers = Object.keys(jsonData)
        const includes = providers.includes(provider)
        if (!includes) {
            console.log("Please check the provider name, Unable to logout")
        }
        jsonData[provider] = ""
        await Bun.write("./db/auth.json",JSON.stringify(jsonData))
        console.log(`Logged out of ${provider} successfully!`)  
    })

