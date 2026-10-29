import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { TasksService } from './tasks.service.js';
import { NotFoundException } from '@nestjs/common';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';
import { AdminFindTasksQueryDto } from './dto/admin-find-tasks-query.dto.js';

function createService() {
  const qb = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getMany: vi.fn().mockResolvedValue([]),
  };
  const repository = {
    createQueryBuilder: vi.fn(() => qb),
    create: vi.fn((task) => task),
    save: vi.fn(async (task) => ({ id: 1, ...task })),
  };
  const userRepository = { exists: vi.fn().mockResolvedValue(true) };
  const service = new TasksService(repository as any, userRepository as any);
  return { service, qb, repository, userRepository };
}

describe('TasksService.findAll filters', () => {
  it('only scopes by user when no filters are given', async () => {
    const { service, qb } = createService();

    await service.findAll(7);

    expect(qb.where).toHaveBeenCalledWith('task.userId = :userId', { userId: 7 });
    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('adds a case-insensitive title/description search', async () => {
    const { service, qb } = createService();

    await service.findAll(7, { q: '  Report ' });

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(task.title) LIKE :search'),
      { search: '%report%' },
    );
  });

  it('escapes LIKE wildcards in the search term', async () => {
    const { service, qb } = createService();

    await service.findAll(7, { q: '50%_off\\' });

    expect(qb.andWhere).toHaveBeenCalledWith(expect.any(String), {
      search: '%50\\%\\_off\\\\%',
    });
  });

  it('filters by completed status, including false', async () => {
    const { service, qb } = createService();

    await service.findAll(7, { completed: false });

    expect(qb.andWhere).toHaveBeenCalledWith('task.completed = :completed', { completed: false });
  });
});

describe('TasksService admin methods', () => {
  it('lists tasks of all users when no userId is given', async () => {
    const { service, qb } = createService();

    await service.findAllForAdmin();

    expect(qb.where).not.toHaveBeenCalled();
  });

  it('narrows to one user and still applies filters', async () => {
    const { service, qb } = createService();

    await service.findAllForAdmin({ userId: 3, completed: true });

    expect(qb.where).toHaveBeenCalledWith('task.userId = :userId', { userId: 3 });
    expect(qb.andWhere).toHaveBeenCalledWith('task.completed = :completed', { completed: true });
  });

  it('creates a task for the given user', async () => {
    const { service, repository } = createService();

    const task = await service.createTaskForUser({ userId: 5, title: 'Review' });

    expect(repository.create).toHaveBeenCalledWith({ title: 'Review', userId: 5 });
    expect(task).toMatchObject({ id: 1, userId: 5, title: 'Review' });
  });

  it('rejects creating a task for a missing user', async () => {
    const { service, repository, userRepository } = createService();
    userRepository.exists.mockResolvedValue(false);

    await expect(service.createTaskForUser({ userId: 99, title: 'X' })).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('AdminFindTasksQueryDto', () => {
  const toDto = (raw: Record<string, unknown>) =>
    plainToInstance(AdminFindTasksQueryDto, raw);

  it('converts the userId query string to a number', () => {
    const dto = toDto({ userId: '4' });
    expect(dto.userId).toBe(4);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects a non-numeric userId', () => {
    expect(validateSync(toDto({ userId: 'abc' }))).not.toHaveLength(0);
  });
});

describe('FindTasksQueryDto', () => {
  const toDto = (raw: Record<string, unknown>) =>
    plainToInstance(FindTasksQueryDto, raw);

  it('converts "true" and "false" query strings to booleans', () => {
    expect(toDto({ completed: 'true' }).completed).toBe(true);
    expect(toDto({ completed: 'false' }).completed).toBe(false);
  });

  it('accepts an empty query', () => {
    expect(validateSync(toDto({}))).toHaveLength(0);
  });

  it('rejects non-boolean completed values', () => {
    expect(validateSync(toDto({ completed: 'maybe' }))).not.toHaveLength(0);
  });

  it('rejects a search term longer than 100 characters', () => {
    expect(validateSync(toDto({ q: 'a'.repeat(101) }))).not.toHaveLength(0);
  });
});
