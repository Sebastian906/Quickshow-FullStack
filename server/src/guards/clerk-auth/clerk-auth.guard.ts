import { verifyToken } from '@clerk/backend';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) { }

  async canActivate(context: ExecutionContext,): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authentication token provided');
    }

    const token = authHeader.substring(7);
    const clerkSecretKey = this.configService.get<string>('CLERK_SECRET_KEY');

    try {
      const verifiedToken = await verifyToken(token, { secretKey: clerkSecretKey });
      request.user = verifiedToken;
      request.auth = { userId: verifiedToken.sub }; // para que tu controller lo use igual
      return true;
    } catch (error) {
      console.error('❌ Clerk token verification failed:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
