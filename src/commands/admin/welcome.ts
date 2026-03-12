import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { getGroup, setGroup } from '../../utils/store'
import { sendCard } from '../../utils/card';

const welcome: Command = {
  name: 'welcome',
  description: 'Gestisce il messaggio di benvenuto (on/off/set/test/image)',
  permission: "admin",
  groupOnly: true,

  async run({ sock, from, sender, msg, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sock.sendMessage(from, { text: gate.reason! })
      return
    }

    const sub = (args[0] || '').toLowerCase()

    if (sub === 'on' || sub === 'off') {
      setGroup(from, { welcome_enabled: sub === 'on' })
      await sock.sendMessage(from, { text: `✅ Welcome ${sub === 'on' ? 'attivato' : 'disattivato'}.` })
      return
    }

    if (sub === 'set') {
      const text = args.slice(1).join(' ').trim()
      if (!text) {
        await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Inserisci il testo`"})
        return
      }

      setGroup(from, { welcome_text: text })
      await sock.sendMessage(from, { text: '✅ Testo welcome aggiornato.' })
      return
    }

    if (sub == "image"){
      const choose = args[1]
      if(choose == "remove"){
        setGroup(from, {welcome_image: "no"})
        await sock.sendMessage(from, { text: '✅ Immagine welcome rimossa.' })
        return
      } else {
        if(!choose.startsWith("https")){
          await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Deve essere un link!, usa il comando !imgur rispondendo a una foto per convertirla in link.`"})
          return
        }
        setGroup(from, {welcome_image: choose})
        await sock.sendMessage(from, { text: '✅ Immagine welcome aggiornata.' })
        return
      }
    }

    if (sub === 'test') {
      const s = getGroup(from)
      const preview = (s.welcome_text || '')
        .replace('{name}', '@utente')
        .replace('{group}', 'Questo Gruppo')

      if(s.welcome_image == "no"){
        await sock.sendMessage(from, { text: `🧪 Preview welcome:\n\n${preview}` })
        return
      } else {
        await sock.sendMessage(from, {image: {url: s.welcome_image}, caption:  `🧪 Preview welcome:\n\n${preview}`})
        return
      }
    }
    const s = getGroup(from)
    await sock.sendMessage(from, {
      text:
`📌 Welcome: ${s.welcome_enabled ? 'ON ✅' : 'OFF ❌'}

Uso:
!welcome on | !welcome off | !welcome set <testo> | !welcome test | !welcome image <link>/remove

Placeholder:
• {mention}  (menzione)
• {group} (nome gruppo)

Testo attuale:
${s.welcome_text || '—'}`
    })
  }
}

export default welcome
