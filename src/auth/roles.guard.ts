import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from './jwt.strategy.js';
import { ROLES_KEY } from './roles.decorator.js';

// Must run after JwtAuthGuard so request.user is populated.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: JwtPayload }>().user;
    return !!user && requiredRoles.includes(user.role);
  }
}
