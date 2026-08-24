// Has the option to selectively read : offset: 1-indexed start line (negative counts from end). limit: max lines to return.
export const readFile = async (path: string, offset?: number, limit?: number) => {
    try {
        const file = Bun.file(path)
        if (!(await file.exists())) {
            return {
                success: false,
                data: `File not found: ${path}`,
            }
        }

        const text = await file.text()
        const lines = text.split("\n")
        const totalLines = lines.length

        let start: number
        if (offset === undefined) {
            start = 1
        } else if (offset < 0) {
            start = Math.max(1, totalLines + offset + 1)
        } else {
            start = Math.max(1, offset)
        }

        if (start > totalLines) {
            return {
                success: false,
                data: `offset ${offset} is past end of file (${totalLines} lines)`,
            }
        }

        const end =
            limit === undefined
                ? totalLines
                : Math.min(totalLines, start + Math.max(0, limit) - 1)

        const selected = lines.slice(start - 1, end)
        const numbered = selected
            .map((line, i) => `${start + i}|${line}`)
            .join("\n")

        return {
            success: true,
            data: numbered,
        }
    } catch (err) {
        console.log(err)
        return {
            success: false,
            data: "Error while running readFile function",
        }
    }
}


export const writeFile = async(path:string, content:string) => {
    try{
        await Bun.write(path,content)
        return {
            success: true,
            data: "File write successfull"
        }
    } catch(err) {
        console.log(err)
        return {
            success: false,
            data: "Error while running writeFile function"
        }
    }     
}


// Exact unique replace. Set replaceAll to true to replace every occurrence.
export const editFile = async (
    path: string,
    oldString: string,
    newString: string,
    replaceAll = false,
) => {
    try {
        const file = Bun.file(path)
        if (!(await file.exists())) {
            return {
                success: false,
                data: `File not found: ${path}`,
            }
        }

        if (oldString === "") {
            return {
                success: false,
                data: "oldString must not be empty",
            }
        }

        if (oldString === newString) {
            return {
                success: false,
                data: "oldString and newString are identical; nothing to change",
            }
        }

        const text = await file.text() as string
        const occurrences = text.split(oldString).length - 1

        if (occurrences === 0) {
            return {
                success: false,
                data: "oldString not found in file",
            }
        }

        if (occurrences > 1 && !replaceAll) {
            return {
                success: false,
                data: `oldString found ${occurrences} times; make it more unique or set replaceAll to true`,
            }
        }

        const updated = replaceAll
            ? text.replaceAll(oldString, newString)
            : text.replace(oldString, newString)

        await Bun.write(path, updated)

        return {
            success: true,
            data: replaceAll
                ? `Replaced ${occurrences} occurrence(s)`
                : "File edit successful",
        }
    } catch (err) {
        console.log(err)
        return {
            success: false,
            data: "Error while running editFile function",
        }
    }
}

export const bash = async (command: string) => {
    try {
        if (!command.trim()) {
            return {
                success: false,
                data: "command must not be empty",
            }
        }

        const proc = Bun.spawn(["bash", "-c", command], {
            cwd: process.cwd(),
            stdout: "pipe",
            stderr: "pipe",
        })

        const [stdout, stderr, exitCode] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
            proc.exited,
        ])

        const parts: string[] = []
        if (stdout) parts.push(stdout.trimEnd())
        if (stderr) parts.push(`stderr:\n${stderr.trimEnd()}`)
        parts.push(`exit_code: ${exitCode}`)

        return {
            success: exitCode === 0,
            data: parts.join("\n"),
        }
    } catch (err) {
        console.log(err)
        return {
            success: false,
            data: "Error while running bash function",
        }
    }
}