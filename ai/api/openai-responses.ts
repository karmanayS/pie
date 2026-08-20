import OpenAI from "openai";

export const openaiResponsesApi = async() => {
    try {
        const content = Bun.file("./commands/providers/auth.json")
        const openaiApiKey = await content.json()["openai"]["key"]  
        const client = new OpenAI({apiKey: openaiApiKey});

        const response = await client.responses.create({
        model: "gpt-5.6",
        input: "Write a one-sentence bedtime story about a unicorn.",
        });

        console.log(response.output_text);
    } catch(err) {
        console.log(err)
        return "Error while generating response"
    }
}    