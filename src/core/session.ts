import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
export async function createSocket() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const {version} = await fetchLatestBaileysVersion() 
  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: process.env.LOG_LEVEL || 'silent' })
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📷 Scansiona questo QR da WhatsApp ➜ Impostazioni > Dispositivi collegati > Collega dispositivo')
      qrcode.generate(qr, { small: true })
    }

    if (connection === "close") {
      const code = (lastDisconnect?.error as any)?.output?.statusCode

      if (code === DisconnectReason.loggedOut) {
        console.log("🔒 Sessione terminata: serve nuovo QR")
        process.exit(0)
      }

      console.log("⚠️ Connessione persa, riavvio tramite PM2")
      process.exit(1)
}
    if (connection === 'open') {
      console.log('✅ Connessione aperta: bot online.')
      const botJid = sock.user?.id
      console.log(botJid)
    }
  })

  return sock
}
