import { PermissionsService } from './permissions.service'; // add

@Module({
  // imports ... (as-is)
  controllers: [AuthController],
  providers: [AuthService, PrismaService, PermissionsService], // add
  exports: [PermissionsService], // add
})
export class AuthModule {}
