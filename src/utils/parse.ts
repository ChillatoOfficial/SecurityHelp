export function parseCommand(text: string | undefined, prefix: string) {
  if (!text || !text.startsWith(prefix)) return null
  const [cmd, ...args] = text.slice(prefix.length).trim().split(/\s+/)
  return { cmd: cmd.toLowerCase(), args }
}
