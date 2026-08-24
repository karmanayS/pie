export const readFile = async(path:string) => {
    try {
        const content = Bun.file(path)
        const jsonContent = await content.json()
        return {
            success: true,
            data: jsonContent
        }
    } catch(err) {
        console.log(err)
        return {
            success: false,
            data: "Error while running readFile function"
        }
    }
} 