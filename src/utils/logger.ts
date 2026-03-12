import { getLogGroup } from "./store"

export async function sendLog(
  sock: any,
  originGroupJid: string,
  payload: { title: string; text: string; by?: string; mentions?: string[] }
) {
  const logJid = getLogGroup(originGroupJid)
  if (!logJid) return

  const byLine = payload.by ? `👤 By: @${payload.by.split("@")[0]}\n` : ""
  const header = `🧾 *LOG*\n${byLine}🏷️ Tipo: *${payload.title}*\n📍 Origine: ${originGroupJid}\n\n`

  const mentions = payload.by
    ? [payload.by, ...(payload.mentions || [])]
    : (payload.mentions || [])

  await sock.sendMessage(logJid, {
    text: header + payload.text,
    mentions
  })
}
