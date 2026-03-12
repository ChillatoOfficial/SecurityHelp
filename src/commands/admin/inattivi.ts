import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { sendCard } from '../../utils/card'
import { addModLog, computeInactiveUsers, listInactiveExempt } from '../../utils/store'

function parseDuration(input: string): number | null {
  const m = (input || '').trim().match(/^(\d+)\s*([smhdw])$/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  const u = m[2].toLowerCase()
  const mult: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000
  }
  return n * mult[u]
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const inattivi: Command = {
  name: 'inattivi',
  description: 'Kick utenti che non scrivono da X tempo (es: !inattivi 1d)',
  permission: "admin",
  groupOnly: true,

  async run({ sock, from, sender, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {
        jid: from,
        image: "assets/dany.png",
        title: "*⛔ ACCESSO NEGATO ⛔*",
        message: "`" + gate.reason! + "`"
      })
      return
    }

    const durationStr = args[0]
    const ms = parseDuration(durationStr)
    if (!ms) {
      await sendCard(sock, {
        jid: from,
        image: "assets/warning.png",
        title: "*⚠️ ATTENZIONE ⚠️*",
        message: "`Usa: !inattivi 1d | 6h | 30m`"
      })
      return
    }

    const force = (args[1] || '').toLowerCase() === 'force'

    try {
      const meta = await sock.groupMetadata(from)
      const participants = meta.participants || []

      const memberJids = participants.map((p: any) => p.id).filter(Boolean) as string[]

      const botJid =
        (sock as any)?.user?.id ||
        (sock as any)?.user?.jid ||
        (sock as any)?.user?.user?.id

      const admins = new Set(
        participants
          .filter((p: any) => p.admin)
          .map((p: any) => p.id)
      )

      const exempt = new Set<string>([
        ...(listInactiveExempt ? listInactiveExempt(from) : []),
        ...(botJid ? [botJid] : []),
        sender,
        meta.owner
      ].filter(Boolean) as string[])

      const filteredMembers = memberJids.filter(jid => {
        if (admins.has(jid)) return false
        if (exempt.has(jid)) return false
        return true
      })

      const { inactive } = computeInactiveUsers(from, filteredMembers, ms, {
        includeNeverSeen: true,
        exempt: []
      })

      if (!inactive.length) {
        await sock.sendMessage(from, { text: "Nessun inattivo trovato ✅" })
        return
      }
      if (inactive.length > 30 && !force) {
        await sendCard(sock, {
          jid: from,
          image: "assets/warning.png",
          title: "*⚠️ MASS KICK BLOCCATO ⚠️*",
          message:
            "`Trovati " + inactive.length + " inattivi. Per procedere: !inattivi " + durationStr + " force`"
        })
        return
      }

      const reason = `Inattivo da > ${durationStr}`

      for (const part of chunk(inactive, 10)) {
        await sock.groupParticipantsUpdate(from, part, 'remove')
        for (const jid of part) {
          addModLog(from, {
            action: 'KICK',
            target: jid,
            by: sender,
            reason
          })
        }
      }

      await sock.sendMessage(from, {
        text: `🧹 *Pulizia completata*\n\n🚫 Rimossi: *${inactive.length}*\n⏱️ Soglia: *${durationStr}*\n📄 Motivo: ${reason}`
      })

    } catch {
      await sendCard(sock, {
        jid: from,
        image: "assets/warning.png",
        title: "*⚠️ ATTENZIONE ⚠️*",
        message: "`Non ho i permessi admin o impossibile leggere/rimuovere membri`"
      })
    }
  }
}

export default inattivi
