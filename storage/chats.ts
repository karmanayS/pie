import type { Chat } from "../types"

const chatsPath = "./db/chats.json"

export const readChats = async (): Promise<Chat[]> => {
    const file = Bun.file(chatsPath)
    if (!(await file.exists())) return []

    const content = await file.text()
    if (!content.trim()) return []

    const chats: unknown = JSON.parse(content)
    if (!Array.isArray(chats)) {
        throw new Error("Invalid chats database: expected an array")
    }

    return chats as Chat[]
}

export const writeChats = async (chats: Chat[]): Promise<void> => {
    await Bun.write(chatsPath, JSON.stringify(chats))
}

export const findChat = async (chatId: string): Promise<Chat | undefined> => {
    const chats = await readChats()
    return chats.find(chat => chat.id === chatId)
}
