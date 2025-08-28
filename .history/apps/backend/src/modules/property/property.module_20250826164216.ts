import { Module } from '@nestjs/common';
import { HotelsModule } from './hotels/hotels.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [HotelsModule, RoomsModule],
})
export class PropertyModule {}
