import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import type { JwtPayload } from './jwt.strategy.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

// Admin routes accept either a Bearer JWT or HTTP Basic credentials checked
// against the `admins` table. Pair with RolesGuard + @Roles(Role.ADMIN) so a
// USER JWT is still rejected.
@Injectable()
export class AdminAuthGuard extends JwtAuthGuard {
  constructor(private readonly authService: AuthService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: JwtPayload }>();
    const header = request.headers.authorization;

    if (!header?.match(/^Basic /i)) {
      return super.canActivate(context) as Promise<boolean>;
    }

    try {
      request.user = await this.authService.validateAdmin(parseBasicAuth(header));
      return true;
    } catch {
      http.getResponse<Response>().setHeader('WWW-Authenticate', 'Basic realm="admin"');
      throw new UnauthorizedException('Invalid username or password');
    }
  }
}

function parseBasicAuth(header: string) {
  const decoded = Buffer.from(header.slice('Basic '.length).trim(), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');

  // Passwords may contain ':', so only split on the first one.
  if (separator < 1) {
    throw new UnauthorizedException();
  }

  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}
