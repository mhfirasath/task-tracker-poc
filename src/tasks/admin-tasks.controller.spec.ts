import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AdminTasksController } from './admin-tasks.controller.js';
import { TasksService } from './tasks.service.js';

describe('AdminTasksController', () => {
  let controller: AdminTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTasksController],
      providers: [{ provide: TasksService, useValue: {} }],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminTasksController>(AdminTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
