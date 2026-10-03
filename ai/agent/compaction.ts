import { Models } from "@opencode-ai/models"
import { summarisationPrompt, summarisationSystemPrompt } from "./constants"
import { openaiResponsesApi } from "../api/openai-responses";
import OpenAI from "openai"

const client = Models.make()

export const isContextFull = async(usedTokens: number) => {
    const state = Bun.file("./db/state.json")
    const stateJson = await state.json()
    const providerInfo = await client.providers() 

    const modelDetails = providerInfo[stateJson.provider].models[stateJson.model]
    const modelContextWindow = modelDetails.limit.context
    const maxModelOutputTokens = modelDetails.limit.output

    if (usedTokens > modelContextWindow - maxModelOutputTokens) {
        return true
    }
    return false
}


export const compactContext = async(chatId:string,model: string) => {

    const chatFile = Bun.file("./db/chats.json")
    const chatsJson = await chatFile.json()
    const chat = chatsJson.find((c:any) => c.id === chatId)

    let countedTokens = 0;
    let compactTriggerIndex = 0; //this is the index of the last message that will be inlcuded in the summary
    for (let i=chat.input.length - 1; i>=0 ; i--) {
        const currentChatInput = chat.input[i]
        
        if (countedTokens >= 20000) {
            if (currentChatInput.type !== "function_call_output") {
                compactTriggerIndex = i - 1
                break
            }
        }
        
        let chars = 0;

        // roles: user, developer, assistant, function call
        
        if (currentChatInput.type === "function_call") {
            chars += currentChatInput.name.length + JSON.stringify(currentChatInput.arguments).length
        } else if (currentChatInput.type === "function_call_output") {
            chars += currentChatInput.output.length
        } else {
            switch (currentChatInput.role) {
                case "user":
                    chars += currentChatInput.content.length
                    break;
                case "assistant":
                    for (let i=0;i<currentChatInput.content.length;i++) {
                        if (currentChatInput.content[i].type === "output_text") {
                            chars += currentChatInput.content[i].text.length
                        }
                    }
                    break
                default:
                    break;
            }
        }

        countedTokens += Math.ceil(chars / 4)
    }

    const messagesToSummarise = []

    for (let i=0;i<=compactTriggerIndex;i++) {
        const currentChatInput = chat.input[i]

        if (currentChatInput.type === "function_call") {
            messagesToSummarise.push(JSON.stringify({
                type: currentChatInput.type,
                name: currentChatInput.name,
                arguments: currentChatInput.arguments
            }))
        } else if (currentChatInput.type === "function_call_output") {
            messagesToSummarise.push(JSON.stringify({
                type: currentChatInput.type,
                output: currentChatInput.output
            }))
        } else {
            switch (currentChatInput.role) {
                case "user":
                    messagesToSummarise.push(JSON.stringify({
                        role: currentChatInput.role,
                        content: currentChatInput.content
                    }))
                    break;
                case "assistant":
                    for (let i=0;i<currentChatInput.content.length;i++) {
                        if (currentChatInput.content[i].type === "output_text") {
                            messagesToSummarise.push(JSON.stringify({
                                role: currentChatInput.role,
                                content: currentChatInput.content[i].text
                            }))
                        }
                    }
                    break
                default:
                    break;
            }
        }

    }

    const stringifiedMessagesToSummarise = JSON.stringify(messagesToSummarise)

    const prompt = `<conversation-json>\n${stringifiedMessagesToSummarise}\n</conversation-json>\n\n` + summarisationPrompt

    const response = await openaiResponsesApi({model,input: [{role: "developer", content: prompt}],instructions: summarisationSystemPrompt})

    const modelResponse = response.data as OpenAI.Responses.Response
    
    chat.input.push({
        "type": "compaction",
        "id": crypto.randomUUID(),
        "oldestNonCompactedInputIndex": compactTriggerIndex + 1,
        "summary": modelResponse.output_text,
    })
    
    await Bun.write("./db/chats.json",chatsJson)

    return 
}