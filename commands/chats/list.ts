import { Command } from "commander"
import { readChats } from "../../storage/chats"
import { getSelectedChatId } from "../../storage/state"

export const listChatsCommand = new Command("list")
    .description("List saved chats")
    .action(async () => {
        const chats = await readChats()
        if (chats.length === 0) {
            console.log("No chats found")
            return
        }

        const selectedChatId = await getSelectedChatId()

        for (const chat of chats) {
            const selectedMarker = chat.id === selectedChatId ? " (selected)" : ""
            console.log(`${chat.id}  ${chat.title}${selectedMarker}`)
        }
    })
