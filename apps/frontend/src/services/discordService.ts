import { API_ENDPOINTS } from '../constants'
import type { DiscordServer, InviteData } from '../types'

export const discordService = {
  /**
   * Fetches all registered and active Discord servers from the Angora backend.
   */
  async getAllServers(): Promise<DiscordServer[]> {
    const res = await fetch(API_ENDPOINTS.DISCORD_SERVERS)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
  },

  /**
   * Retrieves the dynamic Discord bot OAuth invitation link and client ID.
   */
  async getInviteInfo(): Promise<InviteData> {
    const res = await fetch(API_ENDPOINTS.DISCORD_BOT_INVITE)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
  },

  /**
   * Sends a request to disconnect the Discord bot from a target server.
   */
  async leaveServer(id: string): Promise<void> {
    const res = await fetch(API_ENDPOINTS.DISCORD_SERVER_BY_ID(id), {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
  },
}
