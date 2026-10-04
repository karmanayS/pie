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
