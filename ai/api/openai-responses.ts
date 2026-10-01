import OpenAI from "openai";

interface OpenaiResponsesApiInput {
    model: string
    input: OpenAI.Responses.ResponseInput
    instructions: string
    tools?: OpenAI.Responses.Tool[]
}

export const openaiResponsesApi = async(args: OpenaiResponsesApiInput) => {
    try {
        const content = Bun.file("./db/auth.json")
        const openaiApiKey = await content.json()  
        const client = new OpenAI({apiKey: openaiApiKey["openai"]});

        const response = await client.responses.create({
            model: args.model, //example: "gpt-5.6"
            instructions: args.instructions,
            input: args.input,
            ...(args.tools?.length
                ? { tools: args.tools, tool_choice: "auto" as const }
                : { tool_choice: "none" as const }),
        });

        return {success: true,data: response};
    } catch(err) {
        console.log(err)
        return {success: false,data:"Error while generating response"}
    }
}