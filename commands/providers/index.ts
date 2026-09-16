import { Command } from 'commander';
import { loginCommand } from './login';
import { logoutCommand } from './logout';
import { listProvidersCommand } from './list';
import { setProviderCommand } from './setProvider';
// import { Models } from "@opencode-ai/models"

// const client = Models.make()

// const authFile = Bun.file("./commands/providers/auth.json")
// if (!(await authFile.exists())) { 
//     const providers = await client.providers()
//     const providersList = Object.keys(providers)
//     const authData: Record<string, {type:string,key:string}> = {}
//     for (let i=0;i<providersList.length;i++) {
//         const key = providersList[i]
//         const value = {
//             type: "api",
//             key: "",
//         }
//         authData[key] = value
//     }
//     await Bun.write("./commands/providers/auth.json",JSON.stringify(authData))
// }
export const providerCommand = new Command("providers")
    .description("Provider related information")
    .addCommand(listProvidersCommand)
    .addCommand(loginCommand)
    .addCommand(logoutCommand)
    .addCommand(setProviderCommand)