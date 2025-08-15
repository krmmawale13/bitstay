import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/v1/health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  checkHealth(): { status: string; message: string; timestamp: string } {
    return {
      status: 'ok',
      message: this.appService.getHello(),
      timestamp: new Date().toISOString(),
    };
  }
}
