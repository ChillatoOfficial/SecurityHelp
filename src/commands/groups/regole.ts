import { Command } from "../types";
import { getGroup } from "../../utils/store";
const regole: Command = {
    name: "regole",
    description: "regole del gruppo",
    async run({sock, from}){
        let info = getGroup(from)
        const rules = info.regole.includes("NON SETTATO") ? "*Regole del gruppo:*" : `*Regole del gruppo:*\n\n${info.regole}`
        await sock.sendMessage(from, {text: rules})
    }
}

export default regole