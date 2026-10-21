import OpenAI from "openai"
import { openaiResponsesApi } from "../api/openai-responses"
import { toolRegistry, type ToolName } from "../tools/registry"
import type { RunLoopResult } from "../../types"

export interface RunLoopArgs {
    model: string
    instructions: string
    input: OpenAI.Responses.ResponseInput
    tools: ToolName[]
    maxTurns?: number // no limit when undefined
    // called with every item added to the input (model output and tool results)
    onItems?: (items: OpenAI.Responses.ResponseInputItem[]) => void
    // called after every model response, can return a new input to continue with (used for compaction)
    afterResponse?: (response: OpenAI.Responses.Response) => Promise<OpenAI.Responses.ResponseInput | undefined>
}

// The bare agent loop: call the model, run the tools it asks for, repeat until it stops calling tools.
// Knows nothing about chats or storage, so it can be used by the main agent and by subagents.
export const runLoop = async(args: RunLoopArgs): Promise<RunLoopResult> => {
    let input: OpenAI.Responses.ResponseInput = [...args.input]
    const tools = args.tools.map(name => toolRegistry[name].schema)
    let turns = 0

    while (true) {
        if (args.maxTurns !== undefined && turns >= args.maxTurns) {
            return {
                success: false,
                error: `Agent reached the maximum of ${args.maxTurns} turns without finishing`,
            }
        }
        turns++

        const response = await openaiResponsesApi({model: args.model, input, instructions: args.instructions, tools})
        if (!response.success) {
            return {
                success: false,
                error: String(response.data),
            }
        }

        const modelResponse = response.data as OpenAI.Responses.Response
        const outputItems = modelResponse.output as OpenAI.Responses.ResponseInput

        input.push(...outputItems)
        args.onItems?.(outputItems)

        if (args.afterResponse) {
            try {
                const replacementInput = await args.afterResponse(modelResponse)
                if (replacementInput) {
                    input = replacementInput
                }
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                }
            }
        }

        let calledTool = false

        for (const item of modelResponse.output) {
            if (item.type !== "function_call") continue

            const toolName = item.name as ToolName
            if (!args.tools.includes(toolName)) continue

            const output = await toolRegistry[toolName].run(item.arguments)
            const outputToPush: OpenAI.Responses.ResponseInputItem = {
                type: "function_call_output",
                call_id: item.call_id,
                output,
            }
            input.push(outputToPush)
            args.onItems?.([outputToPush])
            calledTool = true
        }

        if (!calledTool) {
            return {
                success: true,
                output: modelResponse.output_text,
            }
        }
    }
}
