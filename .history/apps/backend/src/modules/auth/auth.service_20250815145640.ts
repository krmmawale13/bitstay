import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(email: string, password: string) {
    // Temporary for testing connectivity only
    return {
      message: 'Login endpoint reachable',
      email,
      password,
    };
  }
}
