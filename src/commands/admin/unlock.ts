import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { sendCard } from '../../utils/card'

const unlock: Command = {
  name: 'unlock',
  description: 'Riapre la chat a tutti',
  permission: "admin",
  async run({ sock, from, sender }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    await sock.groupSettingUpdate(from, 'not_announcement')
    await sock.sendMessage(from, { text: '🔓 Gruppo riaperto: tutti possono scrivere.' })
  }
}
export default unlock
