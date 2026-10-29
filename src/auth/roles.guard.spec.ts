import { describe, expect, it } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

function contextFor(user: unknown, roles?: string[]) {
  const reflector = { getAllAndOverride: () => roles } as unknown as Reflector;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return { guard: new RolesGuard(reflector), context };
}

describe('RolesGuard', () => {
  it('allows routes without @Roles', () => {
    const { guard, context } = contextFor({ role: 'USER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a user with a required role', () => {
    const { guard, context } = contextFor({ role: 'ADMIN' }, ['ADMIN']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies a user without a required role', () => {
    const { guard, context } = contextFor({ role: 'USER' }, ['ADMIN']);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies when there is no authenticated user', () => {
    const { guard, context } = contextFor(undefined, ['ADMIN']);
    expect(guard.canActivate(context)).toBe(false);
  });
});
