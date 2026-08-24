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
} // selective reading ie reading only the specified lines instead of the whole file, can save tokens

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

export const editFile = async() => {
    
}