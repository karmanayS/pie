import OpenAI from "openai"
import { openaiResponsesApi } from "../api/openai-responses"
import { systemPrompt } from "./constants"
import { bash, editFile, readFile, writeFile } from "../tools/functions"

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
    ] as OpenAI.Responses.ResponseInput //optimise this input array on what to include in this array from the llm output to optimise tokens

    const response = await openaiResponsesApi({model,input})
    if (!response.success) {
        console.log(response.data)
        return
    }
    const modelResponse = response.data as OpenAI.Responses.Response

    //tool-call loop
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
        } else if (item.name === "write_file") {
            const {path,content} = JSON.parse(item.arguments)
            const output = await writeFile(path,content)
            input.push({
                type: "function_call_output",
                call_id: item.call_id,
                output: output.data
            })
        } else if(item.name = "edit_file") {
            const {path, oldString, newString, replaceAll} = JSON.parse(item.arguments)
            const output = await editFile(path,oldString,newString,replaceAll)
            input.push({
                type: "function_call_output",
                call_id: item.call_id,
                output: output.data
            })
        } else if(item.name = "bash_tool") {
            const {command} = JSON.parse(item.arguments)
            const output = await bash(command)
            input.push({
                type: "function_call_output",
                call_id: item.call_id,
                output: output.data
            })
        }
    }
    //seperate worker that persists conversation history to a db for the context 
    //now we need to check the specific api format this provider uses and use that to call the llm and then based on the output/end_token that the llm gives us, we need to decide whether to continue the loop or end it and give the output to the user
    //this is a high level of the architecture but there are some intricacies like what is streaming etc
}