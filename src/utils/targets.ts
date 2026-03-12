// Utils per estrarre target JID da: mentions, reply, args

export function toJid(input: string): string | null {
  if (!input) return null
  if (/@s\.whatsapp\.net$/.test(input)) return input
  const num = input.replace('@', '').replace(/\D/g, '')
  if (!num) return null
  return `${num}@s.whatsapp.net`
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export function getMentionedJids(msg: any): string[] {
  const jids: string[] =
    msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid ??
    msg?.message?.conversation?.contextInfo?.mentionedJid ?? 
    []
  return unique(jids.filter(Boolean))
}

export function getQuotedJid(msg: any): string | null {
  const p =
    msg?.message?.extendedTextMessage?.contextInfo?.participant ||
    msg?.message?.quotedMessage?.key?.participant ||
    null
  return p || null
}

// Primo argomento come possibile target
export function getArgJid(args: string[]): string | null {
  if (!args?.length) return null
  return toJid(args[0])
}

export function pickOneTarget(msg: any, args: string[]): string | null {
  const mentions = getMentionedJids(msg)
  if (mentions.length) return mentions[0]
  const quoted = getQuotedJid(msg)
  if (quoted) return quoted
  const fromArg = getArgJid(args)
  if (fromArg) return fromArg
  return null
}

export function pickManyTargets(msg: any, args: string[]): string[] {
  const mentions = getMentionedJids(msg)
  if (mentions.length) return unique(mentions)
  const alt: string[] = []
  const q = getQuotedJid(msg); if (q) alt.push(q)
  const a = getArgJid(args);   if (a) alt.push(a)
  return unique(alt)
}

export function jidToDisplay(jid: string) {
  let f = jid.replace('@s.whatsapp.net', '')
  return f.replace("@lid", '')
}
