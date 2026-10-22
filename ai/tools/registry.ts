import OpenAI from "openai";
import { bash, editFile, readFile, writeFile } from "./functions";
import { bashTool, editFileTool, readFileTool, spawnAgentTool, writeFileTool } from "./schemas";
import { runLoop } from "../agent/run-loop"; // circular import: run-loop also imports this file, which is fine because each only uses the other inside functions
import { subagentSystemPrompt } from "../agent/constants";

// Passed by runLoop to every tool it runs. Most tools ignore it.
interface ToolContext {
    model: string // model of the agent that called the tool
}

interface ToolDefinition {
    schema: OpenAI.Responses.Tool
    run: (rawArguments: string, context: ToolContext) => Promise<string>
}

const subagentMaxTurns = 20
const maxSubagentReportLength = 10000

// Every tool an agent can use. An agent gets a subset of these by name.
export const toolRegistry = {
    read_file: {
        schema: readFileTool,
        run: async (rawArguments) => {
            const {path, offset, limit} = JSON.parse(rawArguments)
            const output = await readFile(path, offset, limit)
            return output.data
        },
    },
    write_file: {
        schema: writeFileTool,
        run: async (rawArguments) => {
            const {path, content} = JSON.parse(rawArguments)
            const output = await writeFile(path, content)
            return output.data
        },
    },
    edit_file: {
        schema: editFileTool,
        run: async (rawArguments) => {
            const {path, oldString, newString, replaceAll} = JSON.parse(rawArguments)
            const output = await editFile(path, oldString, newString, replaceAll)
            return output.data
        },
    },
    bash_tool: {
        schema: bashTool,
        run: async (rawArguments) => {
            const {command} = JSON.parse(rawArguments)
            const output = await bash(command)
            return output.data
        },
    },
    // Runs a separate agent loop with a fresh context and returns only its final report.
    // Nothing from the subagent is saved and it never compacts, the turn limit keeps it short.
    spawn_agent: {
        schema: spawnAgentTool,
        run: async (rawArguments, context) => {
            const {task} = JSON.parse(rawArguments)
            console.log(`[subagent] started: ${task.split("\n")[0].slice(0, 100)}`)

            let result
            try {
                result = await runLoop({
                    model: context.model,
                    instructions: subagentSystemPrompt,
                    input: [{role: "user", content: task}],
                    tools: ["read_file", "bash_tool"], // read only, and no spawn_agent so subagents cannot spawn subagents
                    maxTurns: subagentMaxTurns,
                })
            } catch (err) {
                result = {success: false as const, error: err instanceof Error ? err.message : String(err)}
            }

            if (!result.success) {
                console.log(`[subagent] failed: ${result.error}`)
                return `Subagent failed: ${result.error}`
            }
            console.log("[subagent] finished")

            if (!result.output.trim()) {
                return "Subagent finished without a report"
            }
            if (result.output.length > maxSubagentReportLength) {
                return result.output.slice(0, maxSubagentReportLength) + "\n[report truncated]"
            }
            return result.output
        },
    },
} satisfies Record<string, ToolDefinition>

export type ToolName = keyof typeof toolRegistry

export const allToolNames = Object.keys(toolRegistry) as ToolName[]
