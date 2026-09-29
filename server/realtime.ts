import { Response } from 'express';

export interface RealtimeEvent {
  id: string;
  type: string;
  payload: any;
  targetUserId?: string;
  targetRole?: string;
  timestamp: string;
}

interface ClientConnection {
  id: string;
  userId: string;
  role: string;
  res: Response;
}

class RealtimeHub {
  private clients: Map<string, ClientConnection> = new Map();

  addClient(id: string, userId: string, role: string, res: Response): void {
    this.clients.set(id, { id, userId, role, res });
    console.log(`[Realtime] Client connected: ${id} (User: ${userId}, Role: ${role}). Active connections: ${this.clients.size}`);
  }

  removeClient(id: string): void {
    this.clients.delete(id);
    console.log(`[Realtime] Client disconnected: ${id}. Active connections: ${this.clients.size}`);
  }

  broadcast(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): void {
    const fullEvent: RealtimeEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    const data = `data: ${JSON.stringify(fullEvent)}\n\n`;

    for (const client of this.clients.values()) {
      // Check targeting
      if (fullEvent.targetUserId && client.userId !== fullEvent.targetUserId) {
        continue;
      }
      if (fullEvent.targetRole && client.role !== fullEvent.targetRole && client.role !== 'admin' && client.role !== 'platform_operator') {
        continue;
      }

      try {
        client.res.write(data);
      } catch (err) {
        console.error(`[Realtime] Failed to push to client ${client.id}:`, err);
        this.removeClient(client.id);
      }
    }
  }

  getConnectionCount(): number {
    return this.clients.size;
  }
}

export const realtimeHub = new RealtimeHub();
