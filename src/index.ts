import 'dotenv/config'
import { createSocket } from './core/session'
import bindMessageListener from './listeners/messages'
import bindParticipantsListener from './listeners/partecipants'

async function main() {
  const sock = await createSocket()
  bindMessageListener(sock)
  bindParticipantsListener(sock)
}
main().catch(err => { console.error('Fatal:', err); process.exit(1) })
