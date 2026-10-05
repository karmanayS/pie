import { Command } from "commander"
import { findChat } from "../../storage/chats"
import { selectChat } from "../../storage/state"

export const resumeChatCommand = new Command("resume")
    .description("Select an existing chat to continue")
    .requiredOption("-i, --id <chat-id>", "ID of the chat to resume")
    .action(async ({ id }) => {
        const chat = await findChat(id)
        if (!chat) {
            console.log(`Chat not found: ${id}`)
            return
        }

        await selectChat(chat.id)
        console.log(`Selected chat: ${chat.title} (${chat.id})`)
    })
