import { sendCard } from '../../utils/card';
import { requireGroupAndAdmin, requireGroupAndAdminEVip } from '../../utils/permissions';
import type { Command } from '../types'

const link: Command = {
  name: "link",
  description: "Ottieni il link di invito del gruppo",
  permission: "admin_vip",
  groupOnly: true,

  async run({ sock, from, sender }) {
    const gate = await requireGroupAndAdminEVip(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    try {
      const code = await sock.groupInviteCode(from)
      const invite = `https://chat.whatsapp.com/${code}`

      await sock.sendMessage(from, {
        text: `🔗 Link del gruppo:\n${invite}`
      })
    } catch (err) {
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Non posso dare il link assicurati che sono amministratore`"})
    }
  }
}

export default link
