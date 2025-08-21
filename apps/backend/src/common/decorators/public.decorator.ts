import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as public so that AuthGuard will skip authentication.
 *
 * Usage:
 *   @Public()
 *   @Post('login')
 *   login(@Body() dto: LoginDto) { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
