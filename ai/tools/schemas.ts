import OpenAI from "openai";

const readFileTool = {
    type: "function",
    name: "read_file",
    description: "Read the content of the given file.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The absolute path of the file you want to read",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    strict: true  
}

const writeFileTool = {
    type: "function",
    name: "write_file",
    description: "Create a new file and write in it or rewrite the whole content of the specified file.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The absolute path of the file you want to write to",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    strict: true
}

const editFileTool = {
    type: "function",
    name: "edit_file",
    description: "Selectively edit the content of the given file.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The absolute path of the file you want to edit",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    strict: true
}

const bashTool = {
    type: "function",
    name: "bash_tool",
    description: "Execute the specified bash command. For example: ls, pwd, grep, etc.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command that needs to be executed.",
        },
      },
      required: ["command"],
      additionalProperties: false,
    },
    strict: true
}

export const tools = [readFileTool,writeFileTool,editFileTool,bashTool] as  OpenAI.Responses.Tool[];