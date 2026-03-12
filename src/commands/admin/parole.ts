import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { sendCard } from '../../utils/card'
import { getGroup, setGroup } from '../../utils/store';

const bedwords: Command & {adminOnly?: boolean; groupOnly?: boolean; usage?: string } = {
    name: "parole",
    aliases: ["bw"],
    description: "aggiungi parole bandite nel gruppo",
    adminOnly: true,
    groupOnly: true,
    usage: "!parole add <parola parola2 ecc> | remove <parola>",
    async run({sock, from, sender, msg, args}){
        const gate = await requireGroupAndAdmin(sock, from, sender)
        if(!gate.ok){
            await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
            return
        }

        const sub = (args[0] || '').toLowerCase()
        const cfg = getGroup(from)
        let success: string[] = []
        let notsuccess: string[] = []
        if(sub == "add"){
            const clean = (s: string) =>
                s.trim()
                .replace(/^["']+|["']+$/g, "")
                .replace(/\s+/g, " ") 
            const text = args.slice(1).join(' ')
            const parts = text.includes(',')
            ? text.split(',')
            : [text]
            if (!text) {
                await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Inserisci le parole bandite`"})
                return
            }
            for (const p of parts){
                const parola = clean(p).toLowerCase()
                console.log(parola)
                if(!parola) continue
                if(!cfg.parole_bandite.includes(parola)){
                    cfg.parole_bandite.push(parola)
                    setGroup(from, {parole_bandite: cfg.parole_bandite})
                    success.push(parola)
                } else {
                    notsuccess.push(parola)
                }
            }
            await sock.sendMessage(from, {text: "✅ Parole aggiunte:\n" + success.join("\n") + "\n\n❌ Parole gia aggiunte:\n" + notsuccess.join("\n")})
        }

        if(sub == "remove"){
            const text = args.slice(1).join(' ')
            const parts = text.includes("," ) ? text.split(",") : [text]

            if (!text) {
                await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Inserisci le parole bandite`"})
                return
            }
            
            for(const p of parts){
                const parola = p.trim().toLocaleLowerCase()
                if(!parola) continue

                const index = cfg.parole_bandite.indexOf(parola)
                if (index !== -1) {
                    cfg.parole_bandite.splice(index, 1) // 👈 rimuove
                    setGroup(from, {parole_bandite: cfg.parole_bandite})
                    success.push(parola)
                } else {
                    notsuccess.push(parola)
                }
            }
            await sock.sendMessage(from, {text: "✅ Parole rimosse:\n" + success.join("\n") + "\n\n❌ Parole non trovate:\n" + notsuccess.join("\n")})
        }

        if(sub == "list"){
            const parole = cfg.parole_bandite.join("\n")
            await sock.sendMessage(from, {text: "*📃 Parole bandite:*\n" + parole + "\n\n❗ Parole totali: " + cfg.parole_bandite.length})
        }
    }
}

export default bedwords