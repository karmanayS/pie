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

        const isContextFull = await contextCheck(modelResponse.usage?.total_tokens!,provider,model)
        if (isContextFull && chatId) {
            await compactContext(chatId,model)
        }
        
        input.push(...(modelResponse.output as OpenAI.Responses.ResponseInput))
        
        let calledTool = false
        
        for (const item of modelResponse.output) {
            if (item.type !== "function_call") continue

            if (item.name === "read_file") {
                const {path,offset,limit} = JSON.parse(item.arguments)
                const output = await readFile(path,offset,limit)
                input.push({
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: output.data
                })
                calledTool = true
            } else if (item.name === "write_file") {
                const {path,content} = JSON.parse(item.arguments)
                const output = await writeFile(path,content)
                input.push({
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: output.data
                })
                calledTool = true
            } else if(item.name === "edit_file") {
                const {path, oldString, newString, replaceAll} = JSON.parse(item.arguments)
                const output = await editFile(path,oldString,newString,replaceAll)
                input.push({
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: output.data
                })
                calledTool = true
            } else if(item.name === "bash_tool") {
                const {command} = JSON.parse(item.arguments)
                const output = await bash(command)
                input.push({
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: output.data
                })
                calledTool = true
            }
        }
        if (!calledTool) {
            if (chat) {
                chat.input = input
            } else {
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
