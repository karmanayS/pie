import OpenAI from "openai";
import { bash, editFile, readFile, writeFile } from "./functions";
import { bashTool, editFileTool, readFileTool, writeFileTool } from "./schemas";

interface ToolDefinition {
    schema: OpenAI.Responses.Tool
    run: (rawArguments: string) => Promise<string>
}

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
} satisfies Record<string, ToolDefinition>

export type ToolName = keyof typeof toolRegistry

export const allToolNames = Object.keys(toolRegistry) as ToolName[]
