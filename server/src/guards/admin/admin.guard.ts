import { clerkClient } from '@clerk/express';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      if (!request.auth) {
        throw new UnauthorizedException('Authentication middleware not configured');
      }
      const { userId } = request.auth;
      if (!userId) {
        throw new UnauthorizedException('Not Authorized');
      }
      const user = await clerkClient.users.getUser(userId);
      if (user.privateMetadata?.role !== 'admin') {
        throw new UnauthorizedException('Not Authorized - Admin access required');
      }
      request.user = user;
      return true;
    } catch (error) {
      console.error('Admin guard error:', error.message);
      throw new UnauthorizedException(error.message || 'Not Authorized');
    }
  }
}
