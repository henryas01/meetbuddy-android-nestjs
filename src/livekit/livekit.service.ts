import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AccessToken,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  EncodingOptionsPreset,
} from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  // In-memory mapping room -> active egressId
  // For production/multi-instance, store this in DB/Redis instead.
  private readonly activeRoomEgress = new Map<string, string>();

  private readonly egressClient: EgressClient;

  constructor() {
    const url = process.env.LIVEKIT_URL;
    const key = process.env.LIVEKIT_API_KEY;
    const secret = process.env.LIVEKIT_API_SECRET;

    if (!url || !key || !secret) {
      throw new Error(
        'Missing LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET',
      );
    }

    // EgressClient uses the same LiveKit URL and your API credentials
    this.egressClient = new EgressClient(url, key, secret);
  }
  async createToken(userId: string, room: string) {
    const token = new AccessToken(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      process.env.LIVEKIT_API_KEY!,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      process.env.LIVEKIT_API_SECRET!,
      { identity: userId },
    );

    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
    });

    return token.toJwt();
  }

  private buildS3Output() {
    const bucket = process.env.RECORDING_S3_BUCKET;
    const region = process.env.RECORDING_S3_REGION;
    const accessKey = process.env.RECORDING_S3_ACCESS_KEY;
    const secret = process.env.RECORDING_S3_SECRET;

    if (!bucket || !region || !accessKey || !secret) {
      throw new BadRequestException(
        'Recording storage is not configured. Set RECORDING_S3_BUCKET/REGION/ACCESS_KEY/SECRET',
      );
    }

    return {
      case: 's3' as const,
      value: {
        bucket,
        region,
        accessKey,
        secret,
        endpoint: process.env.RECORDING_S3_ENDPOINT || undefined,
        forcePathStyle:
          (process.env.RECORDING_S3_FORCE_PATH_STYLE || 'false') === 'true',
      },
    };
  }

  async startRecording(roomName: string) {
    // If we already tracked an active egress for this room, block duplicate starts
    if (this.activeRoomEgress.has(roomName)) {
      throw new BadRequestException(
        `Recording already started for room "${roomName}"`,
      );
    }

    // MP4 output to S3 with templated filename
    // LiveKit supports templates like {room_name} and {time}. :contentReference[oaicite:3]{index=3}
    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: `recordings/{room_name}/{time}.mp4`,
      output: this.buildS3Output(),
    });

    // Start room composite recording. :contentReference[oaicite:4]{index=4}
    const info = await this.egressClient.startRoomCompositeEgress(
      roomName,
      fileOutput,
      {
        layout: 'grid',
        encodingOptions: EncodingOptionsPreset.H264_720P_30,
      },
    );

    // EgressInfo contains egressId
    this.activeRoomEgress.set(roomName, info.egressId);

    return info;
  }

  async stopRecording(roomName: string) {
    // First try our in-memory mapping
    const knownId = this.activeRoomEgress.get(roomName);

    if (knownId) {
      const stopped = await this.egressClient.stopEgress(knownId); // :contentReference[oaicite:5]{index=5}
      this.activeRoomEgress.delete(roomName);
      return stopped;
    }

    // Fallback: find active egress by room and stop the newest one
    const active = await this.egressClient.listEgress({
      roomName,
      active: true,
    }); // :contentReference[oaicite:6]{index=6}
    if (!active.length) {
      throw new BadRequestException(
        `No active recording found for room "${roomName}"`,
      );
    }

    // Stop the first one (or sort if you prefer)
    const stopped = await this.egressClient.stopEgress(active[0].egressId);
    return stopped;
  }

  async listRecordings(roomName: string) {
    // This lists active + recently completed egress jobs depending on server retention. :contentReference[oaicite:7]{index=7}
    return this.egressClient.listEgress({ roomName });
  }
}
