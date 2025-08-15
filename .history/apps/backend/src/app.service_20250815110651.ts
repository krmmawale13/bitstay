import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { status: string; timestamp: string } {
    return {
      status: 'BitStay backend running',
      timestamp: new Date().toISOString(),
    };
  }
}
