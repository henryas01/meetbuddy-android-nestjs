import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { MediasoupService } from 'src/mediasoup/mediasoup.service';
import { Server, WebSocket } from 'ws';

interface PeerState {
  sendTransport?: any;
  recvTransport?: any;
  producers: any[];
  consumers: any[];
  pendingProducers: Map<string, string>;
  user: string;
}

@WebSocketGateway({ path: '/ws/meeting' })
export class MeetingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private rooms = new Map<string, Map<WebSocket, PeerState>>(); // room -> peers

  constructor(private mediasoup: MediasoupService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async handleConnection(client: WebSocket, req: any) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomName = url.searchParams.get('room') || 'default';
    const user =
      url.searchParams.get('user') ||
      `Guest-${Math.floor(Math.random() * 1000)}`;

    if (!this.rooms.has(roomName)) this.rooms.set(roomName, new Map());
    const peers = this.rooms.get(roomName)!;

    const state: PeerState = {
      user,
      producers: [],
      consumers: [],
      pendingProducers: new Map(),
    };
    peers.set(client, state);

    console.log(`Peer joined: ${user} | Total peers: ${peers.size}`);

    // Kirim routerRtpCapabilities
    client.send(
      JSON.stringify({
        type: 'routerRtpCapabilities',
        data: this.mediasoup.getRtpCapabilities(),
      }),
    );

    client.on('message', async (raw: Buffer) => {
      const msg = JSON.parse(raw.toString());

      // ===== CHAT =====
      if (msg.type === 'chat') {
        for (const [peer] of peers) {
          peer.send(
            JSON.stringify({
              type: 'chat',
              from: user,
              text: msg.text,
              timestamp: Date.now(),
            }),
          );
        }
        return;
      }

      // ===== CREATE SEND TRANSPORT =====
      if (msg.type === 'createSendTransport') {
        const t = await this.mediasoup.createWebRtcTransport();
        state.sendTransport = t;
        client.send(
          JSON.stringify({
            type: 'sendTransportCreated',
            data: {
              id: t.id,
              iceParameters: t.iceParameters,
              iceCandidates: t.iceCandidates,
              dtlsParameters: t.dtlsParameters,
            },
          }),
        );
      }

      // ===== CREATE RECV TRANSPORT =====
      if (msg.type === 'createRecvTransport') {
        const t = await this.mediasoup.createWebRtcTransport();
        state.recvTransport = t;
        client.send(
          JSON.stringify({
            type: 'recvTransportCreated',
            data: {
              id: t.id,
              iceParameters: t.iceParameters,
              iceCandidates: t.iceCandidates,
              dtlsParameters: t.dtlsParameters,
            },
          }),
        );
      }

      // ===== CONNECT TRANSPORT =====
      if (msg.type === 'connectTransport') {
        const t =
          msg.direction === 'send' ? state.sendTransport : state.recvTransport;
        await t.connect({ dtlsParameters: msg.dtlsParameters });
      }

      // ===== PRODUCE =====
      if (msg.type === 'produce') {
        const producer = await state.sendTransport.produce({
          kind: msg.kind,
          rtpParameters: msg.rtpParameters,
        });
        producer.appData = { user };
        state.producers.push(producer);

        // Broadcast ke semua peer lain
        for (const [peer, peerState] of peers) {
          if (peer === client) continue;
          peerState.pendingProducers.set(producer.id, producer.user);
          peer.send(
            JSON.stringify({
              type: 'newProducer',
              producerId: producer.id,
              kind: producer.kind,
              user: producer.user,
            }),
          );
        }
      }

      // ===== CONSUME =====
      if (msg.type === 'consume') {
        if (
          !this.mediasoup.router.canConsume({
            producerId: msg.producerId,
            rtpCapabilities: msg.rtpCapabilities,
          })
        )
          return;
        const consumer = await state.recvTransport.consume({
          producerId: msg.producerId,
          rtpCapabilities: msg.rtpCapabilities,
        });
        state.consumers.push(consumer);
        state.pendingProducers.delete(msg.producerId);

        client.send(
          JSON.stringify({
            type: 'consumed',
            data: {
              id: consumer.id,
              producerId: msg.producerId,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
              user: msg.user,
            },
          }),
        );
      }
    });

    client.on('close', () => {
      peers.delete(client);
      console.log(`Peer left: ${user} | Total peers: ${peers.size}`);
    });
  }

  handleDisconnect(client: WebSocket) {
    for (const peers of this.rooms.values()) {
      if (peers.has(client)) peers.delete(client);
    }
  }
}
