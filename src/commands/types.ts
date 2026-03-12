import type { WASocket, proto } from '@whiskeysockets/baileys'

export interface Ctx {
  sock: WASocket
  msg: proto.IWebMessageInfo
  from: string
  sender: string
  args: string[]
}

export type Permission = 'admin' | 'admin_vip' | 'all'

export interface Command {
  name: string
  aliases?: string[]
  description?: string

  groupOnly?: boolean
  permission?: Permission 

  run(ctx: Ctx): Promise<void>
}
