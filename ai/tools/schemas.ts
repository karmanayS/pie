import OpenAI from "openai";

const readFileTool = {
    type: "function",
    name: "read_file",
    description:
        "Read a file and return numbered lines (N|content). Optionally read only a slice of lines. offset is 1-indexed; negative offset counts from the end of the file. limit is the max number of lines to return. Omit offset and limit (pass null) to read the whole file.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Absolute path of the file to read",
            },
            offset: {
                type: ["number", "null"],
                description:
                    "1-indexed start line. Negative values count from the end (e.g. -1 is the last line). Pass null to start at line 1.",
            },
            limit: {
                type: ["number", "null"],
                description:
                    "Maximum number of lines to return from offset. Pass null to read through the end of the file.",
            },
        },
        required: ["path", "offset", "limit"],
        additionalProperties: false,
    },
    strict: true,
}

const writeFileTool = {
    type: "function",
    name: "write_file",
    description:
        "Create a new file or overwrite an existing file with the full given content.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Absolute path of the file to write",
            },
            content: {
                type: "string",
                description: "Full content to write to the file",
            },
        },
        required: ["path", "content"],
        additionalProperties: false,
    },
    strict: true,
}

const editFileTool = {
    type: "function",
    name: "edit_file",
    description:
        "Surgically edit a file by replacing an exact oldString with newString. By default the match must be unique; if oldString appears more than once, the edit fails unless replaceAll is true.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Absolute path of the file to edit",
            },
            oldString: {
                type: "string",
                description: "Exact text to find in the file (must not be empty)",
            },
            newString: {
                type: "string",
                description: "Exact text to replace oldString with",
            },
            replaceAll: {
                type: ["boolean", "null"],
                description:
                    "If true, replace every occurrence of oldString. If false or null, require a unique match.",
            },
        },
        required: ["path", "oldString", "newString", "replaceAll"],
        additionalProperties: false,
    },
    strict: true,
}

const bashTool = {
    type: "function",
    name: "bash_tool",
    description:
        "Execute a bash command in the current working directory. Returns stdout, stderr (if any), and exit_code. success is true only when exit_code is 0.",
    parameters: {
        type: "object",
        properties: {
            command: {
                type: "string",
                description: "The bash command to execute (e.g. ls, pwd, grep)",
            },
        },
        required: ["command"],
        additionalProperties: false,
    },
    strict: true,
}

export const tools = [readFileTool, writeFileTool, editFileTool, bashTool] as OpenAI.Responses.Tool[];
