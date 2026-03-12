import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { getGroup, setGroup } from '../../utils/store'
import { sendCard } from '../../utils/card'

function getMsgText(msg: any): string {
  // Baileys: conversation | extendedTextMessage.text | image/video caption ecc.
  return (
    msg?.message?.conversation ??
    msg?.message?.extendedTextMessage?.text ??
    msg?.message?.imageMessage?.caption ??
    msg?.message?.videoMessage?.caption ??
    msg?.message?.documentMessage?.caption ??
    ''
  )
}

function extractRulesRaw(msg: any, commandName = 'setregole'): string {
  const raw = getMsgText(msg)

  // rimuove prefisso + comando + "set" e lascia tutto il resto INCLUSI newline
  // Esempi supportati: !setregole set <testo>, /setregole set <testo>, setregole set <testo>
  const re = new RegExp(`^[!/\\.]?${commandName}\\s+set\\s+`, 'i')
  return raw.replace(re, '').trim()
}

const setregole: Command = {
  name: "setregole",
  description: "setta le regole del gruppo",
  permission: "admin",
  groupOnly: true,
  async run({ sock, from, sender, msg, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    const sub = (args[0] || '').toLowerCase()

    if (sub === "set") {
      const text = extractRulesRaw(msg, "setregole")

      if (!text) {
        await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Inserisci un testo`"})
        return
      }

      setGroup(from, { regole: text })
      await sock.sendMessage(from, { text: "✅ Regole settate con successo" })
      return
    }

    if (sub === "test") {
      const i = getGroup(from)
      const re = i.regole && i.regole.trim().length > 0 ? i.regole : "non sono settate"
      await sock.sendMessage(from, { text: re })
      return
    }

    await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Usa: " + "usa !regole set <testo> | !setregole test" + "`"})
  } 
}

export default setregole
