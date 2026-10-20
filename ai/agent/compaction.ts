import { Models } from "@opencode-ai/models"
import { summarisationPrompt, summarisationSystemPrompt } from "./constants"
import { openaiResponsesApi } from "../api/openai-responses";
import OpenAI from "openai"
import type { ChatInputItem, CompactionEntry } from "../../types";

const client = Models.make()

export const contextCheck = async(usedTokens:number,provider:string,model:string) => {
    const providerInfo = await client.providers() 
    const modelDetails = providerInfo[provider].models[model]
    const modelContextWindow = modelDetails.limit.context
    const maxModelOutputTokens = modelDetails.limit.output

    if (usedTokens > modelContextWindow - maxModelOutputTokens) {
        return true
    }
    return false
}


export const compactContext = async(chatInput: ChatInputItem[],model: string): Promise<CompactionEntry> => {
    let countedTokens = 0;
    let compactTriggerIndex = 0; //this is the index of the last message that will be inlcuded in the summary
    for (let i=chatInput.length - 1; i>=0 ; i--) {
        const currentChatInput = chatInput[i]
        
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
        } else if ("role" in currentChatInput) {
            switch (currentChatInput.role) {
                case "user":
                    chars += currentChatInput.content.length
                    break;
                case "assistant":
                    const content = currentChatInput.content
                    if (typeof content === "string") {
                        chars += content.length
                    } else {
                        for (const part of content) {
                            if (part.type === "output_text") {
                                chars += part.text.length
                            }
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
        const currentChatInput = chatInput[i]

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
        } else if ("role" in currentChatInput) {
            switch (currentChatInput.role) {
                case "user":
                    messagesToSummarise.push(JSON.stringify({
                        role: currentChatInput.role,
                        content: currentChatInput.content
                    }))
                    break;
                case "assistant":
                    const content = currentChatInput.content
                    if (typeof(content) === "string") {
                        messagesToSummarise.push(JSON.stringify({
                        role: currentChatInput.role,
                        content: content
                    }))
                    } else {
                        for (const element of content) {
                            if (element.type === "output_text") {
                                messagesToSummarise.push(JSON.stringify({
                                    role: currentChatInput.role,
                                    content: element.text
                                }))
                            }
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

    if (!response.success) {
        throw new Error(String(response.data))
    }

    const modelResponse = response.data as OpenAI.Responses.Response

    return {
        "type": "local_compaction" as const,
        "id": crypto.randomUUID(),
        "oldestNonCompactedInputIndex": compactTriggerIndex + 1,
        "summary": modelResponse.output_text,
    }
}
