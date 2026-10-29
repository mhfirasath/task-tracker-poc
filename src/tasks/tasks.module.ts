import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';


import { Task } from './task.entity.js';
import { User } from '../auth/user.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminTasksController } from './admin-tasks.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User]),
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [TasksController, AdminTasksController],
  providers: [TasksService]
})
export class TasksModule {}
