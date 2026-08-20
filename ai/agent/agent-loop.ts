export const agentLoop = ({prompt,model}:{prompt:string,model:string}) => {
    //user gives a prompt => we give the prompt and the available tools to the llm => llm gives us the response => if tool_call(end_token=tool_use then we execute the tool and give the whole converstation to the llm again till we get the end token) else (if end_token=conversation ended then just give the output to the user)

    // const provider = check the selected provider/ the provider that is logged in
    //const model = check the selected model
    //now we need to check the specific api format this provider uses and use that to call the llm and then based on the output/end_token that the llm gives us, we need to decide whether to continue the loop or end it and give the output to the user
    //this is a high level of the architecture but there are some intricacies like what is streaming etc
}