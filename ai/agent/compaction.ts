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
    const chat = chatsJson[chatId]

    //dont compact a certain amount of recent messages
    //the separation point shouldnt be somewhere where between tool call and tool result, they both should be together always
    let countedTokens = 0;
    for ()

    //compact the rest of the messages behind that. Compaction should be smart and optimised ie what to keep and what not to keep and how to summarise
    // now this summary should be persisted somewhere else or in the db chats file only ?
    // if it is stored somewhere else then how should it look, should it look like a normal input that we pass to the llm only or should it look different if different then how should it be passed to the llm
    // and when later a user resumes a session then how do we know that this session was compacted and we need to send the compacted input ?
    // how does summarisation of an already summarised chat will work ?

    return 
}