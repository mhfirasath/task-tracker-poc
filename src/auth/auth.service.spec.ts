import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminSeedService } from './admin-seed.service.js';
import { AuthService } from './auth.service.js';

function repositoryReturning(account: unknown) {
  const qb = {
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    getOne: vi.fn().mockResolvedValue(account),
  };
  return { createQueryBuilder: vi.fn(() => qb) };
}

async function createService(options: { user?: unknown; admin?: unknown }) {
  const jwtService = { sign: vi.fn(() => 'token') };
  const service = new AuthService(
    repositoryReturning(options.user) as any,
    repositoryReturning(options.admin) as any,
    jwtService as any,
  );
  return { service, jwtService };
}

describe('AuthService', () => {
  it('issues an ADMIN token for an admin from the admins table', async () => {
    const password = await bcrypt.hash('admin$123', 4);
    const { service, jwtService } = await createService({
      admin: { id: 1, username: 'admin', password },
    });

    await expect(
      service.adminLogin({ username: 'admin', password: 'admin$123' }),
    ).resolves.toEqual({ access_token: 'token' });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, username: 'admin', role: 'ADMIN' });
  });

  it('always issues a USER token from the users table, whatever the stored role', async () => {
    const password = await bcrypt.hash('secret', 4);
    const { service, jwtService } = await createService({
      user: { id: 2, username: 'bob', password, role: 'ADMIN' },
    });

    await service.login({ username: 'bob', password: 'secret' });

    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 2, username: 'bob', role: 'USER' });
  });

  it('rejects a wrong admin password', async () => {
    const password = await bcrypt.hash('admin$123', 4);
    const { service } = await createService({ admin: { id: 1, username: 'admin', password } });

    await expect(
      service.adminLogin({ username: 'admin', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an unknown admin', async () => {
    const { service } = await createService({ admin: null });

    await expect(
      service.adminLogin({ username: 'nobody', password: 'x' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

describe('AdminSeedService', () => {
  function createSeeder(exists: boolean) {
    const repository = {
      exists: vi.fn().mockResolvedValue(exists),
      create: vi.fn((admin) => admin),
      save: vi.fn(async (admin) => admin),
    };
    return { seeder: new AdminSeedService(repository as any), repository };
  }

  it('creates the default admin with a hashed password', async () => {
    const { seeder, repository } = createSeeder(false);

    await seeder.onApplicationBootstrap();

    const saved = repository.save.mock.calls[0][0];
    expect(saved.username).toBe('admin');
    expect(saved.password).not.toBe('admin$123');
    expect(await bcrypt.compare('admin$123', saved.password)).toBe(true);
  });

  it('does nothing when the admin already exists', async () => {
    const { seeder, repository } = createSeeder(true);

    await seeder.onApplicationBootstrap();

    expect(repository.save).not.toHaveBeenCalled();
  });
});
