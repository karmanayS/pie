import { Command } from "commander"
import { findChat } from "../../storage/chats"
import { getSelectedChatId } from "../../storage/state"

export const currentChatCommand = new Command("current")
    .description("Show the selected chat")
    .action(async () => {
        const selectedChatId = await getSelectedChatId()
        if (!selectedChatId) {
            console.log("No chat selected")
            return
        }

        const chat = await findChat(selectedChatId)
        if (!chat) {
            console.log(`Selected chat no longer exists: ${selectedChatId}`)
            return
        }

        console.log(`${chat.id}  ${chat.title}`)
    })
