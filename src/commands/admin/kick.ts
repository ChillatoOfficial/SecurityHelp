import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { pickManyTargets, jidToDisplay } from '../../utils/targets'
import { sendCard } from '../../utils/card'
import { addModLog } from '../../utils/store'

const kick: Command = {
  name: 'kick',
  description: 'Rimuove uno o più utenti (mention/reply/arg)',
  permission: "admin",
  groupOnly: true,

  async run({ sock, from, sender, msg, args }) {
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

    const targets = pickManyTargets(msg, args)
    if (!targets.length) {
      await sendCard(sock, {
        jid: from,
        image: "assets/warning.png",
        title: "*⚠️ ATTENZIONE ⚠️*",
        message: "`Usa: !kick @utente motivo`"
      })
      return
    }

    const reason = args.slice(targets.length).join(' ') || 'Nessun motivo specificato'

    try {
      await sock.groupParticipantsUpdate(from, targets, 'remove')
      for (const jid of targets) {
        addModLog(from, {
          action: 'KICK',
          target: jid,
          by: sender,
          reason
        })
     }
      const display = targets.map(jid => `@${jidToDisplay(jid)}`).join(', ')
      await sock.sendMessage(from, {
        text:
          `🚫 *Rimosso*\n\n` +
          `${display}\n\n` +
          `📄 Motivo: ${reason}`,
        mentions: targets
      })
    } catch {
      await sendCard(sock, {
        jid: from,
        image: "assets/warning.png",
        title: "*⚠️ ATTENZIONE ⚠️*",
        message: "`Non ho i permessi admin o impossibile rimuovere`"
      })
    }
  }
}

export default kick
