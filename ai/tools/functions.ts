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

export const editFile = async(path: string, offset?: number, limit?:number) => {
    try {
        
    } catch (err) {
        console.log(err)
        return {
            success: false,
            data: "Error while running the editFile function"
        }
    }
}