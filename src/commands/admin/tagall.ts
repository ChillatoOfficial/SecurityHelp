import type { Command } from '../types'
import { jidToDisplay } from '../../utils/targets'
import { requireGroupAndAdmin, requireGroupAndAdminEVip } from '../../utils/permissions'
import { sendCard } from '../../utils/card';

const tagall: Command = {
  name: 'tagall',
  description: 'Menziona tutti i membri del gruppo',
  groupOnly: true,
  permission: "admin_vip",
  async run({ sock, from, sender, args }) {

    const gate = await requireGroupAndAdminEVip(sock, from, sender)
    console.log(gate)
    if (!gate.ok) {
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    const meta = await sock.groupMetadata(from)
    const members = meta.participants.map((p: any) => p.id)

    if (!members.length) {
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Nessun membro trovato`"})
      return
    }

    const extra = args.join(' ')
    const mentionsText = members.map(j => `@${jidToDisplay(j)}`).join(' ')

    const text = extra
      ? `📢 *TAGALL* da @${jidToDisplay(sender)}\n\n${extra}`
      : `📢 *TAGALL* da @${jidToDisplay(sender)}`

    await sock.sendMessage(from, {
      text,
      mentions: members
    })
  }
}
export default tagall
