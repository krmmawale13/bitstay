import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(email: string, password: string) {
    // For now just test connectivity, real JWT logic comes later
    return {
      message: 'Login endpoint reachable',
      email,
      password,
    };
  }
}
