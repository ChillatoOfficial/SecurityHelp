import type { Command } from './types'
import { readdirSync, statSync } from 'fs'
import { join, extname, basename, sep } from 'path'
import Module from 'module'

const req = Module.createRequire(__filename)

let cache: Command[] | null = null

function isCommandFile(file: string) {
  const ext = extname(file).toLowerCase()
  const base = basename(file, ext)
  if (base === 'types' || base === '_loader') return false
  return ext === '.ts' || ext === '.js'
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (isCommandFile(e)) out.push(p)
  }
  return out
}

function inferFlagsFromPath(path: string) {
  const parts = path.split(sep).map(s => s.toLowerCase())
  const isAdmin = parts.includes('admin')
  const isGroups = parts.includes('groups')
  return {
    adminOnly: isAdmin ? true : undefined,
    groupOnly: isAdmin || isGroups ? true : undefined,
  }
}

export async function loadCommands(): Promise<Command[]> {
  if (cache) return cache
  const base = __dirname
  const files = walk(base)

  const loaded: Command[] = []
  for (const f of files) {
    try {
      const mod = req(f) as { default?: Command } | Command
      const cmd = ((mod as any).default ?? mod) as Command
      if (!cmd?.name || typeof cmd.run !== 'function') continue

      const flags = inferFlagsFromPath(f)
      // applica i flag solo se non sono già impostati nel file del comando
      const patched = Object.assign({}, flags, cmd) as Command & { adminOnly?: boolean; groupOnly?: boolean; vipOnly?: boolean }
      loaded.push(patched)
    } catch (e) {
      console.error('Autoload error on', f, e)
    }
  }
  cache = loaded
  return loaded
}

export async function getCommand(name: string) {
  const list = await loadCommands()
  return list.find(c => c.name === name || c.aliases?.includes(name))
}

export async function listCommands() {
  return loadCommands()
}
