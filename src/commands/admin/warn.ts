import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { pickManyTargets, jidToDisplay } from '../../utils/targets'
import { sendCard } from '../../utils/card'
import { addModLog, addWarn, clearWarns, getWarns } from '../../utils/store'

const MAX_WARNS = 3

const warn: Command = {
  name: 'warn',
  description: 'Assegna un warn a uno o più utenti',
  permission: "admin",
  groupOnly: true,

  async run({ sock, from, sender, msg, args }) {
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

    const targets = pickManyTargets(msg, args)
    if (!targets.length) {
      await sendCard(sock, {
        jid: from,
        image: "assets/warning.png",
        title: "*⚠️ ATTENZIONE ⚠️*",
        message: "`Usa: !warn @utente motivo`"
      })
      return
    }

    const reason = args.slice(targets.length).join(' ') || 'Nessun motivo specificato'

    const results: string[] = []

    for (const jid of targets) {
      const isadmin = await requireGroupAndAdmin(sock, from, jid)
      if(isadmin.ok){
        await sendCard(sock, {
        jid: from,
        image: "assets/dany.png",
        title: "*⛔ ACCESSO NEGATO ⛔*",
        message: "`" + "Non puoi warnare un amministratore" + "`"
      })
      return
      }
      const count = addWarn(from, jid)
      addModLog(from, {
        action: 'WARN',
        target: jid,
        by: sender,
        reason
    })
      results.push(`@${jidToDisplay(jid)} → ${count}/${MAX_WARNS}`)
    }

    await sock.sendMessage(from, {
      text:
        `‼ *Warn assegnato*\n\n` +
        results.join('\n') +
        `\n\n📄 Motivo: ${reason}`,
      mentions: targets
    })

    // kick automatico
    for (const jid of targets) {
      const warns = getWarns(from, jid)
      if (warns >= MAX_WARNS) {
        await sock.groupParticipantsUpdate(from, [jid], 'remove')

        addModLog(from, {
        action: 'KICK',
        target: jid,
        by: sender,
        reason: 'Raggiunto limite warn'
        })
        clearWarns(from, jid)
      }
    }
  }
}

export default warn
