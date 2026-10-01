import { Models } from "@opencode-ai/models"

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


export const compactContext = async(chatId:string) => {
    // iterate backwards through the chat
    const chatFile = Bun.file("./db/chats.json")
    const chatsJson = await chatFile.json()
    const chat = chatsJson.find((c:any) => c.id === chatId)

    //dont compact a certain amount of recent messages
    //the separation point shouldnt be somewhere where between tool call and tool result, they both should be together always
    let countedTokens = 0;
    let compactTriggerIndex = 0;
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

    //compact the rest of the messages behind that. Compaction should be smart and optimised ie what to keep and what not to keep and how to summarise
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



    // now this summary should be persisted somewhere else or in the db chats file only ?
    // if it is stored somewhere else then how should it look, should it look like a normal input that we pass to the llm only or should it look different if different then how should it be passed to the llm
    // and when later a user resumes a session then how do we know that this session was compacted and we need to send the compacted input ?
    // how does summarisation of an already summarised chat will work ?

    return 
}