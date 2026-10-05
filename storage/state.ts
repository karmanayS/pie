import type { AppState } from "../types"

const statePath = "./db/state.json"

export const readAppState = async (): Promise<AppState | null> => {
    const file = Bun.file(statePath)
    if (!(await file.exists())) return null

    const content = await file.text()
    if (!content.trim()) return null

    const state: unknown = JSON.parse(content)
    if (!state || typeof state !== "object" || Array.isArray(state)) {
        throw new Error("Invalid application state: expected an object")
    }

    return state as AppState
}

export const writeAppState = async (state: AppState): Promise<void> => {
    await Bun.write(statePath, JSON.stringify(state))
}

export const getSelectedChatId = async (): Promise<string | null> => {
    const state = await readAppState()
    return state?.selectedChatId ?? null
}

export const selectChat = async (chatId: string): Promise<void> => {
    const selectedChatId = chatId.trim()
    if (!selectedChatId) {
        throw new Error("Chat ID must not be empty")
    }

    const state = await readAppState()
    if (!state) {
        throw new Error("Application state has not been initialized")
    }

    await writeAppState({
        ...state,
        selectedChatId,
    })
}

export const clearSelectedChat = async (): Promise<void> => {
    const state = await readAppState()
    if (!state) return

    await writeAppState({
        ...state,
        selectedChatId: null,
    })
}
