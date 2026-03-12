import fs from 'fs'
import path from 'path'
import type { WASocket } from '@whiskeysockets/baileys'

interface NoticeCardOptions {
  jid: string
  image: string          
  title: string         
  message: string   
  footer?: string       
}

export async function sendCard(
  sock: WASocket,
  opts: NoticeCardOptions
) {
  const { jid, image, title, message, footer } = opts

  const imgPath = path.resolve(process.cwd(), image)

  // fallback se manca immagine
  if (!fs.existsSync(imgPath)) {
    await sock.sendMessage(jid, {
      text: `${title}\n\n${message}`
    })
    return
  }

  const caption =
    `${title}\n\n` +
    `${message}` +
    (footer ? `\n\n${footer}` : '')

  await sock.sendMessage(jid, {
    image: fs.readFileSync(imgPath),
    caption
  })
}
