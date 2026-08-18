import { Command } from 'commander';
import { Models } from "@opencode-ai/models"

const client = Models.make()

const providers = await client.providers()
export const providersList = Object.keys(providers)
const authData: Record<string, {type:string,key:string}> = {}
for (let i=0;i<providersList.length;i++) {
    const key = providersList[i]
    const value = {
        type: "api",
        key: ""
    }
    authData[key] = value
}
await Bun.write("./commands/providers/auth.json",JSON.stringify(authData))


export const listProvidersCommand = new Command("list")
    .description("Lists all available providers")
    .action(() => {
        console.log(providersList)
    })