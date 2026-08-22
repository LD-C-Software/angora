export interface DiscordServer {
  id: string
  guildId: string
  name: string
  iconUrl?: string | null
  ownerId?: string | null
  memberCount: number
  botJoined: boolean
  createdAt: string
  updatedAt: string
}

export interface InviteData {
  inviteUrl: string
  clientId: string
}

export type ToastType = 'error' | 'warning' | 'success' | 'info'

export interface ToastNotification {
  id: string
  type: ToastType
  title: string
  message: string
}

export interface DiscordOutletContext {
  servers: DiscordServer[]
  inviteData: InviteData | null
  loading: boolean
  error: string | null
  leaveServer: (id: string, serverName?: string) => Promise<void>
}
