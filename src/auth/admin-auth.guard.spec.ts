import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const adminPayload = { sub: 1, username: 'admin', role: 'ADMIN' };

function setup(authorization?: string, validateAdmin = vi.fn().mockResolvedValue(adminPayload)) {
  const request: { headers: Record<string, string | undefined>; user?: unknown } = {
    headers: { authorization },
  };
  const response = { setHeader: vi.fn() };
  const context = {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ExecutionContext;
  const guard = new AdminAuthGuard({ validateAdmin } as any);
  return { guard, context, request, response, validateAdmin };
}

const basic = (credentials: string) => `Basic ${Buffer.from(credentials).toString('base64')}`;

describe('AdminAuthGuard', () => {
  it('authenticates valid Basic credentials and sets request.user', async () => {
    const { guard, context, request, validateAdmin } = setup(basic('admin:admin$123'));

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(validateAdmin).toHaveBeenCalledWith({ username: 'admin', password: 'admin$123' });
    expect(request.user).toEqual(adminPayload);
  });

  it('keeps colons inside the password', async () => {
    const { guard, context, validateAdmin } = setup(basic('admin:a:b:c'));

    await guard.canActivate(context);

    expect(validateAdmin).toHaveBeenCalledWith({ username: 'admin', password: 'a:b:c' });
  });

  it('rejects wrong Basic credentials with a WWW-Authenticate challenge', async () => {
    const { guard, context, response } = setup(
      basic('admin:wrong'),
      vi.fn().mockRejectedValue(new UnauthorizedException()),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(response.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="admin"');
  });

  it('rejects malformed Basic credentials without checking the database', async () => {
    const { guard, context, validateAdmin } = setup(basic('no-colon'));

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(validateAdmin).not.toHaveBeenCalled();
  });

  it('falls back to JWT validation for Bearer tokens', async () => {
    const jwtCanActivate = vi
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockResolvedValue(true);
    const { guard, context, validateAdmin } = setup('Bearer some.jwt.token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtCanActivate).toHaveBeenCalled();
    expect(validateAdmin).not.toHaveBeenCalled();
    jwtCanActivate.mockRestore();
  });
});
