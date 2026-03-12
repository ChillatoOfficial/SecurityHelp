import type { Command } from '../types'
import { jidToDisplay } from '../../utils/targets'

const admins: Command = {
  name: 'staff',
  description: 'Mostra la lista staff',
  async run({ sock, from }) {
    const meta = await sock.groupMetadata(from)
    const list = meta.participants.filter((p:any)=>p.admin).map((p:any)=>p.id)
    if (!list.length) return void sock.sendMessage(from,{text:'Nessun admin trovato.'})
    const text = `🛡️ Staff (${list.length}):\n` + list.map(j=>`• @${jidToDisplay(j)}`).join('\n')
    await sock.sendMessage(from,{text, mentions:list})
  }
}
export default admins
