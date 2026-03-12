import type { WASocket } from '@whiskeysockets/baileys'
import { getGroup } from './store'
export function isGroupJid(jid: string) {
  return jid?.endsWith('@g.us')
}

export async function isAdmin(sock: WASocket, groupJid: string, userJid: string) {
  const meta = await sock.groupMetadata(groupJid)
  const admins = meta.participants.filter((p: any) => p.admin).map((p: any) => p.id)
  return admins.includes(userJid)
}

export async function requireGroupAndAdmin(sock: WASocket, from: string, sender: string) {
  if (!isGroupJid(from)) return { ok: false, reason: 'Questo comando funziona solo nei gruppi.' }
  const admin = await isAdmin(sock, from, sender)
  if (!admin) return { ok: false, reason: 'Solo gli admin possono usare questo comando.' }
  return { ok: true }
}

export async function requireGroupAndAdminEVip(
  sock: WASocket,
  from: string,
  sender: string
) {
  if (!isGroupJid(from)) {
    return { ok: false, reason: 'Questo comando funziona solo nei gruppi.' }
  }

  const isAdminUser = await isAdmin(sock, from, sender)
  const isVipUser = getGroup(from).vip.includes(sender)

  if (!isAdminUser && !isVipUser) {
    return { ok: false, reason: 'Solo admin o VIP possono usare questo comando.' }
  }

  return { ok: true }
}
