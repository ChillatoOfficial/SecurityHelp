import type { Command } from './types'
import { listCommands, getCommand } from './_loader'
import { sendCard } from '../utils/card'

type AnyCmd = Command & {
  adminOnly?: boolean
  groupOnly?: boolean,
  usage?: string
}

function badge(c: AnyCmd) {
  let badges = ''

  if (c.permission == "admin") badges += ' 👮‍♂️'
  if (c.groupOnly) badges += ' 👥'
  if(c.permission == "admin_vip") badges += '⭐'

  return badges
}


function fmtList(cmds: AnyCmd[]) {
  if (!cmds.length) return '—'

  return cmds
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c => `• ${badge(c)} *${c.name}* > ${c.description}`)
    .join('\n')
}
function classify(cmds: AnyCmd[]) {
  const admin = cmds.filter(c => c.permission == "admin")
  const group = cmds.filter(c => !c.adminOnly && c.groupOnly)
  const general = cmds.filter(c => !c.adminOnly && !c.groupOnly)
  const vip = cmds.filter(c => c.permission == "admin_vip")
  return { admin, group, general, vip}
}

const help: Command = {
  name: 'cmd',
  description: 'Mostra la lista comandi o i dettagli: !cmd <comando>',
  async run({ sock, from, args }) {
    const q = (args[0] || '').toLowerCase()

    if (q) {
      const cmd = (await getCommand(q)) as AnyCmd | undefined
      if (!cmd) {
        await sendCard(sock, {jid: from, image: "assets/unknow.png", title: "*🛑 Non trovato 🛑*", message: "`Questo comando non e' stato trovato`"})
        return
      }

      const lines: string[] = []
      lines.push(`🔹 *${cmd.name}*${badge(cmd)}`)
      lines.push(`${cmd.description || 'Nessuna descrizione.'}`)

      if ((cmd as any).usage)
        lines.push(`▫ Uso: ${(cmd as any).usage}`)

      lines.push('')

      await sock.sendMessage(from, { text: lines.join('\n') })
      return
    }

    const all = (await listCommands()) as AnyCmd[]
    const { admin, group, general, vip } = classify(all)

    const c =
`📖 *Comandi disponibili*

▸ *Generali*
${fmtList(general)}

▸ *Gruppo*
${fmtList(group)}

▸ *Admin*
${fmtList(admin)}

▸ *Vip*
${fmtList(vip)}

────────────
ℹ️ Info
• Dettagli: !cmd <comando>
• Esempio: !cmd song`

    await sock.sendMessage(from, {text: c})
  }
}

export default help
