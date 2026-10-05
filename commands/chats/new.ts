import { Command } from "commander"
import { clearSelectedChat } from "../../storage/state"

export const newChatCommand = new Command("new")
    .description("Start a new chat with the next agent prompt")
    .action(async () => {
        await clearSelectedChat()
        console.log("Chat selection cleared. The next agent prompt will start a new chat.")
    })
