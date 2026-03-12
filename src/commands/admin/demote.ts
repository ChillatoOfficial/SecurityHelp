import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { pickManyTargets, jidToDisplay } from '../../utils/targets'
import { sendCard } from '../../utils/card'

const demote: Command = {
  name: 'demote',
  description: 'Rimuove i privilegi admin (mention/reply/arg)',
  permission: "admin",
  async run({ sock, from, sender, msg, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok){
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    const targets = pickManyTargets(msg, args)
    if (!targets.length){
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Menziona o rispondi un utente`"})
      return
    }

    await sock.groupParticipantsUpdate(from, targets, 'demote')
    const list = targets.map(j => `@${jidToDisplay(j)}`).join(', ')
    await sock.sendMessage(from, { text: `⬇️ Retrocessi: ${list}`, mentions: targets })
  }
}
export default demote
