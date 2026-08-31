import OpenAI from "openai";
import { tools } from "../tools/schemas";

interface OpenaiResponsesApiInput {
    model: string,
    input: OpenAI.Responses.ResponseInput,
}

export const openaiResponsesApi = async(args: OpenaiResponsesApiInput) => {
    try {
        const content = Bun.file("./commands/providers/auth.json")
        const openaiApiKey = await content.json()["openai"]["key"]  
        const client = new OpenAI({apiKey: openaiApiKey});

        const response = await client.responses.create({
        model: args.model, //example: "gpt-5.6"
        input: args.input,
        tools: tools,
        });

        console.log(response);
    } catch(err) {
        console.log(err)
        return "Error while generating response"
    }
}