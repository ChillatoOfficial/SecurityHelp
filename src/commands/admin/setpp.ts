import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import { sendCard } from '../../utils/card'

async function quotedImageBuffer(msg: any): Promise<Buffer | null> {
  const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  const img = q?.imageMessage
  if (!img) return null

  const stream = await downloadContentFromMessage(img, 'image')
  const chunks: Buffer[] = []
  for await (const c of stream) chunks.push(c as Buffer)
  return Buffer.concat(chunks)
}

const setpp: Command = {
  name: 'setpp',
  description: 'Rispondi a una FOTO e usa: !setpp — imposta come immagine del gruppo',
  permission: "admin",
  async run({ sock, from, sender, msg }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok){
      await sendCard(sock, {jid: from, image: "assets/dany.png", title: "*⛔ ACCESSO NEGATO ⛔*", message: "`" + gate.reason! + "`"})
      return
    }

    const buf = await quotedImageBuffer(msg)
    if (!buf){
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Rispondi a una foto`"})
      return
    }

    try {
      await sock.updateProfilePicture(from, buf)
      await sock.sendMessage(from, { text: '🖼️ Immagine del gruppo aggiornata ✅' })
    } catch (e) {
      console.error('setpp error', e)
      await sock.sendMessage(from, { text: '❌ Impossibile aggiornare l’immagine (serve essere admin e foto valida).' })
    }
  }
}
export default setpp
