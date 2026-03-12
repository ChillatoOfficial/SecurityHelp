import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { sendCard } from '../../utils/card'

const setdesc: Command = {
  name: 'setdesc',
  description: 'Cambia la descrizione del gruppo: !setdesc <nuova descrizione>',
  permission: "admin",
  async run({ sock, from, sender, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok){
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    const desc = args.join(' ').trim()
    if (!desc) {
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Usa: !setdesc <descrizione>`"})
      return
    }

    await sock.groupUpdateDescription(from, desc)
    await sock.sendMessage(from, { text: `✅ Descrizione aggiornata.\n\n${desc}` })
  }
}
export default setdesc
