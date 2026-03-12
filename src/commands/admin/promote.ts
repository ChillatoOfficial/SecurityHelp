import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { pickManyTargets, jidToDisplay } from '../../utils/targets'
import { sendCard } from '../../utils/card'

const promote: Command = {
  name: 'promote',
  description: 'Promuove uno o più utenti ad admin (mention/reply/arg)',
  permission: "admin",
  async run({ sock, from, sender, msg, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    const targets = pickManyTargets(msg, args)
    if (!targets.length) {
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Menziona o rispondi a un utente`"})
      return
    }

    await sock.groupParticipantsUpdate(from, targets, 'promote')
    const list = targets.map(j => `@${jidToDisplay(j)}`).join(', ')
    await sock.sendMessage(from, { text: `⬆️ Promossi admin: ${list}`, mentions: targets })
  }
}
export default promote
