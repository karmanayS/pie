import { Command } from "commander"
import { currentChatCommand } from "./current"
import { listChatsCommand } from "./list"
import { newChatCommand } from "./new"
import { resumeChatCommand } from "./resume"

export const chatsCommand = new Command("chats")
    .description("Manage chats")
    .addCommand(listChatsCommand)
    .addCommand(resumeChatCommand)
    .addCommand(currentChatCommand)
    .addCommand(newChatCommand)
