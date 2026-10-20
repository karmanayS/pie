import OpenAI from "openai"
import { openaiResponsesApi } from "../api/openai-responses"
import { bash, editFile, readFile, writeFile } from "../tools/functions"
import { systemPrompt } from "./constants"
import { tools } from "../tools/schemas"
import { compactContext, contextCheck } from "./compaction"
import { readChats, writeChats } from "../../storage/chats"
import type { AgentLoopResult, Chat, CompactionEntry } from "../../types"

export const agentLoop = async(prompt:string, model:string, provider:string, chatId?: string): Promise<AgentLoopResult> => {
    //agent needs to decide which api format to use based on the model and provider => there can also be a seperate agent file that does all this apart from the agent loop
    let input: OpenAI.Responses.ResponseInput = [
        {
            role: "user",
            content: prompt
        }
    ]

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
            const unsummarizedMessages: OpenAI.Responses.ResponseInputItem[] = []
            for (let i=latestCompactionInputEntry["oldestNonCompactedInputIndex"]; i<chat.input.length; i++) {
                if (chat.input[i].type === "local_compaction") {
                    continue
                }
                unsummarizedMessages.push(chat.input[i] as OpenAI.Responses.ResponseInputItem)
            }
            input = [{
                role: "developer",
                content: `Previous conversation summary:\n${latestCompactionInputEntry.summary}`
            }, ...unsummarizedMessages, {
                role: "user",
                content: prompt
            }]
        } else {
            input = [...(chat.input as OpenAI.Responses.ResponseInputItem[]), {
                role: "user",
                content: prompt
            }]
        }

        chat.input.push({
            role: "user",
            content: prompt
        })
    }

    while (true) {
        const response = await openaiResponsesApi({model,input,instructions: systemPrompt, tools: tools})
        if (!response.success) {
            return {
                success: false,
                error: String(response.data),
            }
        }

        const modelResponse = response.data as OpenAI.Responses.Response

        input.push(...(modelResponse.output as OpenAI.Responses.ResponseInput))
        chat?.input.push(...(modelResponse.output as OpenAI.Responses.ResponseInput))

        const isContextFull = await contextCheck(modelResponse.usage?.total_tokens!,provider,model)
        if (isContextFull && chatId && chat) {
            let compactionEntry: CompactionEntry
            try {
                compactionEntry = await compactContext(chat.input,model)
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                return {
                    success: false,
                    error: `Context compaction failed: ${message}`,
                }
            }
            chat.input.push(compactionEntry)
            const unsummarizedMessages: OpenAI.Responses.ResponseInputItem[] = []
            for (let i=compactionEntry["oldestNonCompactedInputIndex"]; i<chat.input.length;i++) {
                if (chat.input[i].type === "local_compaction") {
                    continue
                } // this would be the last message so we can run the loop till length - 1 and then we can skip this check because we are assuming that each chat will only have single compaction
                unsummarizedMessages.push(chat.input[i] as OpenAI.Responses.ResponseInputItem)
            }
            input = [{
                role: "developer",
                content: `Previous conversation summary:\n${compactionEntry.summary}`
            }, ...unsummarizedMessages]
        }
        
        let calledTool = false
        
        for (const item of modelResponse.output) {
            if (item.type !== "function_call") continue

            let outputToPush: OpenAI.Responses.ResponseInputItem | undefined;

            if (item.name === "read_file") {
                const {path,offset,limit} = JSON.parse(item.arguments)
                const output = await readFile(path,offset,limit)
                outputToPush = {
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: output.data
                }
                calledTool = true
            } else if (item.name === "write_file") {
                const {path,content} = JSON.parse(item.arguments)
                const output = await writeFile(path,content)
                outputToPush = {
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: output.data
                }
                calledTool = true
            } else if(item.name === "edit_file") {
                const {path, oldString, newString, replaceAll} = JSON.parse(item.arguments)
                const output = await editFile(path,oldString,newString,replaceAll)
                outputToPush = {
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: output.data
                }
                calledTool = true
            } else if(item.name === "bash_tool") {
                const {command} = JSON.parse(item.arguments)
                const output = await bash(command)
                outputToPush = {
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: output.data
                }
                calledTool = true
            }

            if (outputToPush) {
                input.push(outputToPush)
                chat?.input.push(outputToPush)
            }

        }
        if (!calledTool) {
            if (!chat) {
                jsonChats.push({
                    id: activeChatId,
                    title: prompt,
                    timestamp: Date.now(),
                    input
                })
            }
            await writeChats(jsonChats)
            return {
                success: true,
                output: modelResponse.output_text,
                chatId: activeChatId,
            }
        }
    }    
}
