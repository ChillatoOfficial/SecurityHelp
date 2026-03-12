import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { pickManyTargets, jidToDisplay } from '../../utils/targets'
import { sendCard } from '../../utils/card'
import { getUserLogs, getWarns } from '../../utils/store'

const MAX_WARNS = 3

function fmtWhen(ts: number) {
  return new Date(ts).toLocaleString('it-IT')
}

const log: Command = {
  name: 'log',
  description: 'Mostra moderation log di un utente',
  permission: "admin",
  groupOnly: true,
  async run({ sock, from, sender, msg, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, { jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`" })
      return
    }

    const targets = pickManyTargets(msg, args)
    if (!targets.length) {
      await sendCard(sock, { jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Usa: !log @utente`" })
      return
    }

    const target = targets[0]
    const currentWarns = getWarns(from, target)
    const entries = getUserLogs(from, target, 10)

    const header =
      `📋 *Moderation Log*\n` +
      `Utente: @${jidToDisplay(target)}\n` +
      `Warn attuali: ${currentWarns}/${MAX_WARNS}\n`

    if (!entries.length) {
      await sock.sendMessage(from, { text: header + `\n— Nessun evento registrato`, mentions: [target] })
      return
    }

    const lines = entries.map(e => {
      const who = `@${jidToDisplay(e.by)}`
      const reason = e.reason ? ` — ${e.reason}` : ''
      return `• *${e.action}* (${fmtWhen(e.at)})\n  by ${who}${reason}`
    })

    await sock.sendMessage(from, {
      text: header + `\n` + lines.join('\n\n'),
      mentions: [target, ...entries.map(e => e.by)]
    })
  }
}

export default log
