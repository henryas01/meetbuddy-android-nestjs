import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

@WebSocketGateway({
  path: '/ws/meeting',
  transports: ['websocket'], // IMPORTANT
})
export class MeetingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients = new Map<WebSocket, { user: string; room: string }>();

  handleConnection(client: WebSocket, req: IncomingMessage) {
    const url = new URL(req.url!, 'http://localhost');

    const room = url.searchParams.get('room');
    const user = url.searchParams.get('user');

    if (!room || !user) {
      client.close();
      return;
    }

    this.clients.set(client, { room, user });

    console.log(`${user} joined ${room}`);

    // Notify others
    this.broadcast(room, {
      type: 'system',
      text: `${user} joined the room`,
    });
  }

  handleDisconnect(client: WebSocket) {
    const info = this.clients.get(client);
    if (!info) return;

    this.clients.delete(client);

    this.broadcast(info.room, {
      type: 'system',
      text: `${info.user} left the room`,
    });
  }

  // Receive messages from wscat
  handleMessage(client: WebSocket, data: Buffer) {
    const info = this.clients.get(client);
    if (!info) return;

    const message = JSON.parse(data.toString());

    if (message.type === 'chat') {
      this.broadcast(info.room, {
        type: 'chat',
        user: info.user,
        text: message.text,
      });
    }
  }

  private broadcast(room: string, payload: any) {
    const msg = JSON.stringify(payload);

    for (const [client, info] of this.clients.entries()) {
      if (info.room === room && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }
}
