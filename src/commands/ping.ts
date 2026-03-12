import type { Command } from './types'

const ping: Command = {
  name: 'ping',
  description: 'Test di latenza',
  async run({ sock, from }) {
    const t0 = Date.now()
    const m = await sock.sendMessage(from, { text: 'Pong...' })
    const dt = Date.now() - t0
    await sock.sendMessage(from, { text: `✅ Pong! ${dt} ms` }, { quoted: m })
  }
}
export default ping
