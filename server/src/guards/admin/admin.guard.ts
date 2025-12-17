import { clerkClient } from '@clerk/express';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid authorization header');
      }
      
      const auth = await request.auth();
      if (!auth) {
        throw new UnauthorizedException('Authentication failed');
      }
      
      const { userId } = auth;
      if (!userId) {
        throw new UnauthorizedException('Not Authorized');
      }
      const user = await clerkClient.users.getUser(userId);
      
      if (!user.privateMetadata || user.privateMetadata.role !== 'admin') {
        throw new UnauthorizedException('Not Authorized - Admin access required');
      }
      
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Not Authorized');
    }
  }
}
