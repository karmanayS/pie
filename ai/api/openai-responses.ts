import OpenAI from "openai";
import { tools } from "../tools/schemas";

interface OpenaiResponsesApiInput {
    model: string,
    input: OpenAI.Responses.ResponseInput,
}

export const openaiResponsesApi = async(args: OpenaiResponsesApiInput) => {
    try {
        const content = Bun.file("./commands/providers/auth.json")
        const openaiApiKey = await content.json()  
        const client = new OpenAI({apiKey: openaiApiKey["openai"]["key"]});

        const response = await client.responses.create({
        model: args.model, //example: "gpt-5.6"
        input: args.input,
        tools: tools,
        });

        return {success: true,data: response};
    } catch(err) {
        console.log(err)
        return {success: false,data:"Error while generating response"}
    }
}