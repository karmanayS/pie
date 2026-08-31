import OpenAI from "openai"
import { openaiResponsesApi } from "../api/openai-responses"
import { systemPrompt } from "./constants"

export const agentLoop = async(prompt:string,model:string) => {
    //agent needs to decide which api format to use based on the model and provider => there can also be a seperate agent file that does all this apart from the agent loop

    //user gives a prompt => we give the prompt and the available tools to the llm => llm gives us the response => if tool_call(end_token=tool_use then we execute the tool and give the whole converstation to the llm again till we get the end token) , if there is no tool call then we assume that the conversation has ended.
    const input = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "user",
            content: prompt
        }
    ] as OpenAI.Responses.ResponseInput
    const output = await openaiResponsesApi({model,input})
    //seperate worker that persists conversation history to a db for the context 
    // const provider = check the selected provider/ the provider that is logged in
    //const model = check the selected model
    //now we need to check the specific api format this provider uses and use that to call the llm and then based on the output/end_token that the llm gives us, we need to decide whether to continue the loop or end it and give the output to the user
    //this is a high level of the architecture but there are some intricacies like what is streaming etc
}