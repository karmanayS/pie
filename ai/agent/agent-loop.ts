import OpenAI from "openai"
import { openaiResponsesApi } from "../api/openai-responses"
import { bash, editFile, readFile, writeFile } from "../tools/functions"
import { systemPrompt } from "./constants"
import { tools } from "../tools/schemas"

export const agentLoop = async(prompt:string, model:string, provider:string, resume = false, chatId?: string) => {
    //agent needs to decide which api format to use based on the model and provider => there can also be a seperate agent file that does all this apart from the agent loop
    let input: OpenAI.Responses.ResponseInput = [
        {
            role: "user",
            content: prompt
        }
    ]

    let jsonChats = [];
    let chat;
    let latestCompactionInputEntry;

    if (resume && chatId) {
        const content = Bun.file("./db/chats.json")
        jsonChats = await content.json()
        chat = jsonChats.find(c => c.id === chatId)

        for (let i=0;i<chat.input.length;i++) {
            if (chat.input[i].type === "compaction") {
                latestCompactionInputEntry = chat.input[i] 
            }
        }

        if (latestCompactionInputEntry) {
            const unsummarizedMessages = []
            for (let i=latestCompactionInputEntry["oldestNonCompactedInputIndex"]; i<chat.input.length; i++) {
                if (chat.input[i].type === "compaction") {
                    continue
                }
                unsummarizedMessages.push(chat.input[i])
            }
            input = [latestCompactionInputEntry, ...unsummarizedMessages, {
                role: "user",
                content: prompt
            }]
        } else {
            input = [...chat.input, {
                role: "user",
                content: prompt
            }]
        }
    }

    while (true) {
        const response = await openaiResponsesApi({model,input,instructions: systemPrompt, tools: tools})
        if (!response.success) {
            return response.data
        }

        const modelResponse = response.data as OpenAI.Responses.Response
        
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
            // push the input array to chats db
            if (resume && chatId) {
                chat.input = input
            } else {
                jsonChats.push({
                    id: crypto.randomUUID(),
                    title: prompt,
                    timestamp: Date.now(),
                    input
                })
            }
            Bun.write("./db/chats.json", JSON.stringify(jsonChats))
            return modelResponse.output_text
        }
    }    
}