import { Command, program } from 'commander';
import { loginCommand } from './login';
import { logoutCommand } from './logout';
import { setProviderCommand } from './setProvider';
import { listProvidersCommand } from './list';

import { Models } from "@opencode-ai/models"

const client = Models.make()

const providers = await client.providers()
export const providersList = Object.keys(providers)
export const authData: Record<string, {type:string,key:string,isSelected: boolean}> = {}
for (let i=0;i<providersList.length;i++) {
    const key = providersList[i]
    const value = {
        type: "api",
        key: "",
        isSelected: false
    }
    authData[key] = value
}
await Bun.write("./commands/providers/auth.json",JSON.stringify(authData))

export const providerCommand = new Command("providers")
    .description("Provider related information")
    .addCommand(listProvidersCommand)
    .addCommand(loginCommand)
    .addCommand(logoutCommand)
    .addCommand(setProviderCommand)