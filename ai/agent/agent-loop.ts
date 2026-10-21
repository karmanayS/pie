import OpenAI from "openai"
import { systemPrompt } from "./constants"
import { compactContext, contextCheck } from "./compaction"
import { runLoop, type RunLoopArgs } from "./run-loop"
import { allToolNames } from "../tools/registry"
import { readChats, writeChats } from "../../storage/chats"
import type { AgentLoopResult, Chat, ChatInputItem, CompactionEntry } from "../../types"

// Model input after a compaction: the summary followed by every message that was not summarised
const buildInputFromCompaction = (chatInput: ChatInputItem[], compactionEntry: CompactionEntry): OpenAI.Responses.ResponseInput => {
    const unsummarizedMessages: OpenAI.Responses.ResponseInputItem[] = []
    for (let i=compactionEntry["oldestNonCompactedInputIndex"]; i<chatInput.length; i++) {
        if (chatInput[i].type === "local_compaction") {
            continue
        } // assuming that each chat will only have single compaction
        unsummarizedMessages.push(chatInput[i] as OpenAI.Responses.ResponseInputItem)
    }
    return [{
        role: "developer",
        content: `Previous conversation summary:\n${compactionEntry.summary}`
    }, ...unsummarizedMessages]
}

// Compacts the chat once the context is full and returns the input the loop should continue with
const createCompactionHook = (chat: Chat, provider: string, model: string): RunLoopArgs["afterResponse"] => {
    return async(response) => {
        const isContextFull = await contextCheck(response.usage?.total_tokens!,provider,model)
        if (!isContextFull) return undefined

        let compactionEntry: CompactionEntry
        try {
            compactionEntry = await compactContext(chat.input,model)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            throw new Error(`Context compaction failed: ${message}`)
        }
        chat.input.push(compactionEntry)
        return buildInputFromCompaction(chat.input, compactionEntry)
    }
}

// Runs the main agent for a prompt inside a chat: loads the chat history, runs the loop, saves the chat
export const agentLoop = async(prompt:string, model:string, provider:string, chatId?: string): Promise<AgentLoopResult> => {
    //agent needs to decide which api format to use based on the model and provider => there can also be a seperate agent file that does all this apart from the agent loop
    const userMessage: OpenAI.Responses.ResponseInputItem = {
        role: "user",
        content: prompt
    }
    let input: OpenAI.Responses.ResponseInput = [userMessage]

    const jsonChats: Chat[] = await readChats();
    const activeChatId = chatId ?? crypto.randomUUID()
    let chat: Chat | undefined;
    let latestCompactionInputEntry: CompactionEntry | undefined;

    if (chatId) {
        chat = jsonChats.find(c => c.id === chatId)

        if (!chat) {
            return {
                success: false,
                error: `Chat not found: ${chatId}`,
            }
        }

        for (let i=0;i<chat.input.length;i++) {
            const chatInput = chat.input[i]
            if (chatInput.type === "local_compaction") {
                latestCompactionInputEntry = chatInput
            }
        }

        if (latestCompactionInputEntry) {
            input = [...buildInputFromCompaction(chat.input, latestCompactionInputEntry), userMessage]
        } else {
            input = [...(chat.input as OpenAI.Responses.ResponseInputItem[]), userMessage]
        }

        chat.input.push(userMessage)
    }

    // full history that gets saved, separate from the model input which gets replaced on compaction
    const history: ChatInputItem[] = chat ? chat.input : [userMessage]

    const result = await runLoop({
        model,
        input,
        instructions: systemPrompt,
        tools: allToolNames,
        onItems: items => history.push(...items),
        afterResponse: chat ? createCompactionHook(chat, provider, model) : undefined,
    })

    if (!result.success) {
        return result
    }

    if (!chat) {
        jsonChats.push({
            id: activeChatId,
            title: prompt,
            timestamp: Date.now(),
            input: history
        })
    }
    await writeChats(jsonChats)
    return {
        success: true,
        output: result.output,
        chatId: activeChatId,
    }
}
