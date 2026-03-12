import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { sendCard } from '../../utils/card'
import { setLogGroup, clearLogGroup, getLogGroup } from '../../utils/store'

function isGroupJid(jid: string) {
  return typeof jid === "string" && jid.endsWith("@g.us")
}

const logcmd: Command = {
  name: 'loggroup',
  description: 'Gestione gruppo log: set/clear/status/test',
  permission: "admin",
  groupOnly: true,

  async run({ sock, from, sender, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {
        jid: from,
        image: "assets/dany.png",
        title: "*⛔ ACCESSO NEGATO ⛔*",
        message: "`" + gate.reason! + "`"
      })
      return
    }

    const sub = (args[0] || "").toLowerCase()

    if (!["set", "clear", "status", "test"].includes(sub)) {
      await sendCard(sock, {
        jid: from,
        image: "assets/warning.png",
        title: "*⚠️ ATTENZIONE ⚠️*",
        message: "`Usa: !loggroup set <id@g.us> | !loggroup clear | !loggroup status | !loggroup test`"
      })
      return
    }

    if (sub === "status") {
      const current = getLogGroup(from)
      await sock.sendMessage(from, {
        text: current ? `🧾 Gruppo log: *${current}*` : "🧾 Gruppo log: *DISATTIVO*"
      })
      return
    }

    if (sub === "clear") {
      clearLogGroup(from)
      await sock.sendMessage(from, { text: "🧾 Log disattivati ✅" })
      return
    }

    if (sub === "set") {
      const jid = args[1]
      if (!jid || !isGroupJid(jid)) {
        await sendCard(sock, {
          jid: from,
          image: "assets/warning.png",
          title: "*⚠️ ATTENZIONE ⚠️*",
          message: "`Usa: !loggroup set 1203xxxxxxxxx@g.us\n\no usa il comando !id per prendere id del gruppo log`"
        })
        return
      }

      // Verifica che il bot veda quel gruppo (così eviti ID fake)
      try {
        await sock.groupMetadata(jid)
      } catch {
        await sendCard(sock, {
          jid: from,
          image: "assets/warning.png",
          title: "*⚠️ ATTENZIONE ⚠️*",
          message: "`Non posso usare quel gruppo: forse il bot non è dentro o l'ID è errato.`"
        })
        return
      }

      setLogGroup(from, jid)
      await sock.sendMessage(from, { text: `🧾 Gruppo log impostato ✅\n→ ${jid}` })
      return
    }

    if (sub === "test") {
      const logJid = getLogGroup(from)
      if (!logJid) {
        await sock.sendMessage(from, { text: "🧾 Nessun gruppo log impostato. Usa: !log set <id@g.us>" })
        return
      }

      await sock.sendMessage(logJid, {
        text: `🧾 *LOG TEST*\n📍 Origine: ${from}\n👤 By: @${sender.split("@")[0]}\n✅ Funziona.`,
        mentions: [sender]
      })

      await sock.sendMessage(from, { text: "✅ Test inviato nel gruppo log." })
      return
    }
  }
}

export default logcmd
