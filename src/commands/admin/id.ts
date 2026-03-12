import { requireGroupAndAdmin } from '../../utils/permissions'
import type { Command } from '../types'
import { sendCard } from '../../utils/card'

const idcmd: Command = {
    name: "id",
    description: "prendi id di un gruppo",
    permission: "admin",
    groupOnly: true,
    async run ({sock, from, sender}){
        const gate = await requireGroupAndAdmin(sock, from, sender)
        if(!gate.ok){
            await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
            return
        }

        await sock.sendMessage(from, {text: "🆔: " + from})
    }
}

export default idcmd