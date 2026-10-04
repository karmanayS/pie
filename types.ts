import type OpenAI from "openai"

export interface CompactionEntry {
    type: "local_compaction"
    id: string
    oldestNonCompactedInputIndex: number
    summary: string
}

export type ChatInputItem = OpenAI.Responses.ResponseInputItem | CompactionEntry

export interface Chat {
    id: string
    timestamp: number
    title: string
    input: ChatInputItem[]
    provider?: string
    model?: string
    updatedAt?: number
}

export interface AppState {
    provider: string
    model: string
    selectedChatId?: string | null
}
