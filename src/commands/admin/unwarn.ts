import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { pickManyTargets, jidToDisplay } from '../../utils/targets'
import { sendCard } from '../../utils/card'
import { addModLog, removeWarn } from '../../utils/store'

const MAX_WARNS = 3

const unwarn: Command = {
  name: 'unwarn',
  description: 'Rimuove 1 warn a uno o più utenti',
  permission: "admin",

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

    const targets = pickManyTargets(msg, args)
    if (!targets.length) {
      await sendCard(sock, {
        jid: from,
        image: 'assets/warning.png',
        title: '*⚠️ ATTENZIONE ⚠️*',
        message: '`Usa: !unwarn @utente`'
      })
      return
    }

    const results: string[] = []
    const reason = args.slice(targets.length).join(' ') || 'Nessun motivo specificato'
    for (const jid of targets) {
      const isadmin = await requireGroupAndAdmin(sock, from, jid)
      if(isadmin.ok){
        await sendCard(sock, {
        jid: from,
        image: "assets/dany.png",
        title: "*⛔ ACCESSO NEGATO ⛔*",
        message: "`" + "Non puoi togliere warn a un amministratore" + "`"
      })
      return
      }
      const count = removeWarn(from, jid)
      addModLog(from, {
        action: 'UNWARN',
        target: jid,
        by: sender,
        reason
    })
      results.push(`@${jidToDisplay(jid)} → ${count}/${MAX_WARNS}`)
    }

    await sock.sendMessage(from, {
      text: `✅ *Warn rimosso*\n\n${results.join('\n')}`,
      mentions: targets
    })
  }
}

export default unwarn
