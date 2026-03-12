import type { WAMessage, WAMessageKey, WASocket } from '@whiskeysockets/baileys'
import { parseCommand } from '../utils/parse'
import { getCommand } from '../commands/_loader'
import { isGroupJid, isAdmin, requireGroupAndAdmin } from '../utils/permissions'
import { registerGroup, getGroup, setGroup, touchUser, pruneDailyMessages, bumpDailyMessage } from '../utils/store'
import { sendCard } from '../utils/card'

function unwrapMessage(msg: any) {
  let m = msg?.message
  if (!m) return null
  if (m.ephemeralMessage) m = m.ephemeralMessage.message
  if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message
  if (m.documentWithCaptionMessage) m = m.documentWithCaptionMessage.message
  return m
}

function getTextContent(m: any): string {
  return (
    m?.conversation ??
    m?.extendedTextMessage?.text ??
    m?.imageMessage?.caption ??
    m?.videoMessage?.caption ??
    ''
  )
}

function extractInviteCode(text: string): string | null {
  if (!text) return null
  const key = 'chat.whatsapp.com/'
  const i = text.indexOf(key)
  if (i === -1) return null

  const after = text.slice(i + key.length).trim()
  const token = after.split(/\s+/)[0]?.trim()
  if (!token) return null

  return token.split('?')[0].trim() || null
}

function pickGroupJidFromAcceptResult(res: any): string | null {
  if (!res) return null
  if (typeof res === 'string') return res
  return res.gid || res.groupId || res.id || res.groupJid || null
}

async function acceptInviteRobust(sock: WASocket, inviteCode: string): Promise<string> {
  try {
    const hasV4 = typeof (sock as any).groupAcceptInviteV4 === 'function'
    if (hasV4) {
      let inviteInfo: any = null

      // alcuni build hanno groupGetInviteInfo, altri no
      if (typeof (sock as any).groupGetInviteInfo === 'function') {
        inviteInfo = await (sock as any).groupGetInviteInfo(inviteCode)
      }

      const payload: any = { inviteCode }

      const groupJid =
        inviteInfo?.id || inviteInfo?.gid || inviteInfo?.groupId || inviteInfo?.groupJid
      const inviteExpiration =
        inviteInfo?.expiration || inviteInfo?.inviteExpiration || inviteInfo?.expiresAt

      if (groupJid) payload.groupJid = groupJid
      if (typeof inviteExpiration === 'number') payload.inviteExpiration = inviteExpiration

      const res = await (sock as any).groupAcceptInviteV4(payload)
      const accepted = pickGroupJidFromAcceptResult(res) || payload.groupJid
      if (accepted) return accepted
    }
  } catch {
  }

  const res2 = await (sock as any).groupAcceptInvite(inviteCode)
  const accepted2 = pickGroupJidFromAcceptResult(res2)
  if (!accepted2) throw new Error('Invite accepted but no groupJid returned')
  return accepted2
}


function extractText(m: WAMessage): string {
  const msg = m.message
  if (!msg) return ""

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    ""
  )
}
function hasLink(text: string): boolean {
  const linkRegex = /((https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/gi
  if (!text) return false
  linkRegex.lastIndex = 0
  return linkRegex.test(text)
}

export async function antilink_func(
  sock: WASocket,
  m: WAMessage,
  user: string,
  group: string
) {
  const cfg = getGroup(group)
  if (!cfg?.antilink) return
  if (!m.message) return
  if (m.key.fromMe) return

  const gate = await requireGroupAndAdmin(sock, group, user)
  if (gate.ok) return

  const text = extractText(m)
  if (!hasLink(text)) return

  await sock.sendMessage(group, { delete: m.key })
}

export async function parole_bandite_func(
  sock: WASocket,
  m: WAMessage,
  user: string,
  group: string
) {
  const cfg = getGroup(group)
  if (!m.message) return
  if (m.key.fromMe) return

  const gate = await requireGroupAndAdmin(sock, group, user)
  if (gate.ok) return

  const text = extractText(m)
    .toLowerCase()
    .trim()

  for (const parola of cfg.parole_bandite) {
    if (!parola) continue

    if (text.includes(parola.toString())) {
      await sock.sendMessage(group, { delete: m.key })
      return
    }
  }
}


export default function bindMessageListener(sock: WASocket) {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages?.[0]
    if (!msg) return

    const from = msg.key.remoteJid!
    const sender = msg.key.participant || msg.key.remoteJid!
    const inner = unwrapMessage(msg)
    if (!inner) return

    const isGroup = from.endsWith('@g.us')
    if(isGroup){
      const info = getGroup(from)
      const incr = info.messaggi + 1
      setGroup(from, {messaggi: incr})
      await antilink_func(sock, msg, sender, from)
      await parole_bandite_func(sock, msg, sender, from)
      touchUser(from, sender)
      bumpDailyMessage(from)
      pruneDailyMessages(from, 90)
    }
    const body = getTextContent(inner)

    if (!isGroupJid(from)) {
      const code = extractInviteCode(body)
      if (code) {
        try {
          const groupJid = await acceptInviteRobust(sock, code)

          let groupName = 'Gruppo'
          try {
            const meta = await sock.groupMetadata(groupJid)
            if (meta?.subject) groupName = meta.subject
          } catch {}
          registerGroup(groupJid, groupName)
          await sock.sendMessage(from, {
          text:
`✅ Fatto!
Sono entrato nel gruppo:

• Nome: ${groupName}
• ID: ${groupJid}

Ora puoi configurarmi direttamente nel gruppo 🙂

📢 Canale: https://whatsapp.com/channel/0029VbBIOaH545uwBcSYiV2L`
        })
          } catch (e){}
      }
    }

    const prefix = process.env.CMD_PREFIX || '!'
    const parsed = parseCommand(body, prefix)
    if (!parsed) return

    const { cmd, args } = parsed
    const command = await getCommand(cmd)
    if (!command) return

    const needsGroup = (command as any).groupOnly === true
    const needpermission = (command as any).permission
    if (needsGroup && !isGroupJid(from)) {
      await sendCard(sock, {
        jid: from,
        image: "assets/dany.png",
        title: "*⛔ ACCESSO NEGATO ⛔*",
        message: "`Questo comando funziona solo nei gruppi.`"
      })
      return
    }

    const isAdminUser = isGroupJid(from) && await isAdmin(sock, from, sender)
    const isVipUser = isGroupJid(from) && getGroup(from).vip.includes(sender)

    if (command.permission == "admin" && !isAdminUser) {
      await sendCard(sock, {
        jid: from,
        image: "assets/dany.png",
        title: "*⛔ ACCESSO NEGATO ⛔*",
        message: "`Solo gli admin possono usare questo comando.`"
      })
      return
    }

    if (command.permission == "admin_vip" && !isAdminUser && !isVipUser) {
      await sendCard(sock, {
        jid: from,
        image: "assets/dany.png",
        title: "*⛔ ACCESSO NEGATO ⛔*",
        message: "`Solo admin o VIP possono usare questo comando.`"
      })
      return
    }


    try {
      await command.run({ sock, msg, from, sender, args })
    } catch (err) {
      await sendCard(sock, {jid: from, image: "assets/warning.png", title: "*⚠️ ATTENZIONE ⚠️*", message: "`Errore comando.`"})
      await sock.sendMessage(from, { text: '⚠️ Errore comando.' })
      console.error(err)
    }
  })
}
