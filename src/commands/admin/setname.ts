import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { sendCard } from '../../utils/card'

const setname: Command = {
  name: 'setname',
  description: 'Cambia il nome del gruppo: !setname <nuovo nome>',
  permission: "admin",
  async run({ sock, from, sender, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    const name = args.join(' ').trim()
    if (!name){
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Usa: !setname <nome>`"})
      return
    }

    await sock.groupUpdateSubject(from, name)
    await sock.sendMessage(from, { text: `✅ Nome gruppo cambiato in: *${name}*` })
  }
}
export default setname
