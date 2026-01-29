import { Injectable } from '@nestjs/common';
import * as mediasoup from 'mediasoup';

@Injectable()
export class MediasoupService {
  worker: mediasoup.types.Worker;
  router: mediasoup.types.Router;

  constructor() {
    this.init();
  }

  async init() {
    this.worker = await mediasoup.createWorker({
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    });

    this.worker.on('died', () => {
      console.error('Mediasoup worker died!');
      process.exit(1);
    });

    this.router = await this.worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
      ],
    });
  }

  getRtpCapabilities() {
    return this.router.rtpCapabilities;
  }

  async createWebRtcTransport() {
    const transport = await this.router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: '192.168.1.3' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });
    return transport;
  }
}
