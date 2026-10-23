import { describe, expect, it, vi } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { TasksService } from './tasks.service.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';

function createService() {
  const qb = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getMany: vi.fn().mockResolvedValue([]),
  };
  const repository = { createQueryBuilder: vi.fn(() => qb) };
  const service = new TasksService(repository as any);
  return { service, qb };
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
