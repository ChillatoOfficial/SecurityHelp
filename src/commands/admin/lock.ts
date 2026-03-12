import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { sendCard } from '../../utils/card'

const lock: Command = {
  name: 'lock',
  description: 'Solo admin possono scrivere (annunci)',
  permission: "admin",
  async run({ sock, from, sender }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok){
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }
    await sock.groupSettingUpdate(from, 'announcement')
    await sock.sendMessage(from, { text: '🔒 Gruppo chiuso: solo admin possono scrivere.' })
  }
}
export default lock
