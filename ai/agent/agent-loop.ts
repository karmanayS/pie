import OpenAI from "openai"
import { openaiResponsesApi } from "../api/openai-responses"
import { systemPrompt } from "./constants"
import { bash, editFile, readFile, writeFile } from "../tools/functions"

export const agentLoop = async(prompt:string, model:string, resume = false, chatId?: string) => {
    //agent needs to decide which api format to use based on the model and provider => there can also be a seperate agent file that does all this apart from the agent loop

    let input: OpenAI.Responses.ResponseInput = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "user",
            content: prompt
        }
    ] //optimise this input array on what to include in this array from the llm output to optimise tokens.

    
    let jsonChats = [];
    let chat;

    if (resume && chatId) {
        const content = Bun.file("./db/chats.json")
        jsonChats = await content.json()
        chat = jsonChats.find(c => c.id === chatId)
        input = [...chat.input, {
            role: "user",
            content: prompt
        }]
    }

    while (true) {
        const response = await openaiResponsesApi({model,input})
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
    //seperate worker that persists conversation history to a db for the context so that user can continue a session. 
    //Streming ?
}