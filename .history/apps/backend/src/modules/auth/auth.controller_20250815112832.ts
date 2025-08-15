import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class LoginDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    const tokens = this.auth.signTokens({ id: user.id, email: user.email, role: user.role });
    return { user: { id: user.id, email: user.email, role: user.role, name: user.name }, tokens };
  }
}