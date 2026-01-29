import { Injectable } from '@nestjs/common';
import { WebSocket } from 'ws';

export interface PeerState {
  sendTransport: any;
  recvTransport: any;
  producers: any[];
  consumers: any[];
  pendingProducers: Map<string, string>;
  user: string;
}

@Injectable()
export class MeetingService {
  private rooms = new Map<string, Map<WebSocket, PeerState>>();

  join(room: string): Map<WebSocket, PeerState> {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Map());
    }
    return this.rooms.get(room)!;
  }

  peers(room: string): Map<WebSocket, PeerState> {
    return this.rooms.get(room) || new Map();
  }

  leave(room: string, client: WebSocket) {
    this.rooms.get(room)?.delete(client);
  }
}
