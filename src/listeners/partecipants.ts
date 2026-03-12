import type { WASocket } from '@whiskeysockets/baileys'
import { getGroup } from '../utils/store'

export default function bindParticipantsListener(sock: WASocket) {
  sock.ev.on('group-participants.update', async (ev) => {
    const { id: groupJid, participants, action } = ev
    const cfg = getGroup(groupJid)

    if (action === 'add' && cfg.welcome_enabled) {
      const meta = await sock.groupMetadata(groupJid).catch(() => null)
      const groupName = meta?.subject || 'il gruppo'

      for (const p of participants) {
        const num = p.replace('@s.whatsapp.net', '')
        const finale = num.replace('@lid', '')

        // supporta {name} e {group}
        const text = (cfg.welcome_text || 'Benvenuto {name} in {group}!')
          .replace('{mention}', '@' + finale)
          .replace('{group}', groupName)

        if(cfg.welcome_image == "no"){
          await sock.sendMessage(groupJid, { text, mentions: [p] })
          return
        } else {
          await sock.sendMessage(groupJid, {image: {url: cfg.welcome_image}, caption: text, mentions: [p]})
          return
        }
      }
    }
  })
}
