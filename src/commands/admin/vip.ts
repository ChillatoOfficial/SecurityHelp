import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { pickManyTargets, jidToDisplay } from '../../utils/targets'
import { sendCard } from '../../utils/card'
import { getGroup, setGroup } from '../../utils/store'

const vip: Command = {
  name: 'vip',
  description: 'Gestisce VIP: add/remove/list',
  permission: "admin",
  groupOnly: true,

  async run({ sock, from, sender, msg, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {
        jid: from,
        image: 'assets/dany.png',
        title: '*⛔ ACCESSO NEGATO ⛔*',
        message: '`' + gate.reason! + '`'
      })
      return
    }

    const sub = (args[0] || '').toLowerCase()
    const cfg = getGroup(from)
    const vipList: string[] = Array.isArray(cfg.vip) ? (cfg.vip as unknown as string[]) : []

    if (!sub || sub === 'list') {
      if (!vipList.length) {
        await sock.sendMessage(from, { text: '⭐ *VIP*\n— Nessun VIP impostato' })
        return
      }

      const lines = vipList.map(jid => `• @${jidToDisplay(jid)}`).join('\n')
      await sock.sendMessage(from, {
        text: `⭐ *VIP* (${vipList.length})\n\n${lines}`,
        mentions: vipList
      })
      return
    }


    if (sub !== 'add' && sub !== 'remove') {
      await sendCard(sock, {
        jid: from,
        image: 'assets/warning.png',
        title: '*⚠️ ATTENZIONE ⚠️*',
        message: '`Usa: !vip add @utente | !vip remove @utente | !vip list`'
      })
      return
    }

    const targets = pickManyTargets(msg, args.slice(1))
    if (!targets.length) {
      await sendCard(sock, {
        jid: from,
        image: 'assets/warning.png',
        title: '*⚠️ ATTENZIONE ⚠️*',
        message: '`Usa: !vip add @utente`'
      })
      return
    }

    const added: string[] = []
    const removed: string[] = []
    const skipped: string[] = []

    if (sub === 'add') {
      for (const jid of targets) {
        if (vipList.includes(jid)) skipped.push(jid)
        else {
          vipList.push(jid)
          added.push(jid)
        }
      }
    } else {
      for (const jid of targets) {
        const idx = vipList.indexOf(jid)
        if (idx === -1) skipped.push(jid)
        else {
          vipList.splice(idx, 1)
          removed.push(jid)
        }
      }
    }

    setGroup(from, { vip: vipList })

    const parts: string[] = []
    parts.push('⭐ *VIP aggiornati*')
    if (added.length) parts.push(`\n✅ Aggiunti:\n${added.map(j => `• @${jidToDisplay(j)}`).join('\n')}`)
    if (removed.length) parts.push(`\n✅ Rimossi:\n${removed.map(j => `• @${jidToDisplay(j)}`).join('\n')}`)
    if (skipped.length) parts.push(`\n⚠️ Nessuna modifica:\n${skipped.map(j => `• @${jidToDisplay(j)}`).join('\n')}`)

    await sock.sendMessage(from, {
      text: parts.join('\n'),
      mentions: [...added, ...removed, ...skipped]
    })
  }
}

export default vip
