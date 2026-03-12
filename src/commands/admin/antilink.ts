import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { getGroup, setGroup } from '../../utils/store'
import { sendCard } from '../../utils/card';

const antilink: Command = {
    name: "antilink",
    description: "disattiva o attiva antilink nel gruppo",
    groupOnly: true,
    permission: "admin",
    async run({sock, from, sender, msg, args}){
        const gate = await requireGroupAndAdmin(sock, from, sender)
        if (!gate.ok){
            await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
            return
        }

        const sub = (args[0] || '').toLowerCase()
        const getconfig = getGroup(from)
        if(sub == "on"){
            if(getconfig.antilink){
                await sendCard(sock, {jid: from, image: "assets/on.png", title: "*✅ ATTIVO ✅*", message: "`Antilink gia attivo`"})
                return
            } else {
                setGroup(from, {antilink: true})
                await sendCard(sock, {jid: from, image: "assets/on.png", title: "*✅ ATTIVATO ✅*", message: "`Antilink attivato`"})
                return
            }
        } else if(sub == "off"){
            if(getconfig.antilink){
                setGroup(from, {antilink: false})
                await sendCard(sock, {jid: from, image: "assets/off.png", title: "*🔴 DISATTIVATO 🔴*", message: "`Antilink disattivato`"})
                return
            } else {
                await sendCard(sock, {jid: from, image: "assets/off.png", title: "*🔴 NON ATTIVO 🔴*", message: "`Antilink non attivo`"})
                return
            }
        } else {
            await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Usa: !antilink on|off`"})
        }
    }
}

export default antilink