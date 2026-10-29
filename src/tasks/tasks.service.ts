import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../auth/user.entity.js';
import { Task } from './task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';
import { AdminFindTasksQueryDto } from './dto/admin-find-tasks-query.dto.js';
import { AdminCreateTaskDto } from './dto/admin-create-task.dto.js';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    findAll(userId: number, query: FindTasksQueryDto = {}) {
        const qb = this.taskRepository
            .createQueryBuilder('task')
            .where('task.userId = :userId', { userId })
            .orderBy('task.id', 'ASC');

        this.applyFilters(qb, query);
        return qb.getMany();
    }

    // Admin-only: not scoped to the caller. Optionally narrowed to one user.
    findAllForAdmin(query: AdminFindTasksQueryDto = {}) {
        const qb = this.taskRepository
            .createQueryBuilder('task')
            .orderBy('task.userId', 'ASC')
            .addOrderBy('task.id', 'ASC');

        if (query.userId !== undefined) {
            qb.where('task.userId = :userId', { userId: query.userId });
        }

        this.applyFilters(qb, query);
        return qb.getMany();
    }

    // Admin-only: create a task on behalf of any existing user.
    async createTaskForUser({ userId, ...createTaskDto }: AdminCreateTaskDto) {
        const userExists = await this.userRepository.exists({ where: { id: userId } });

        if (!userExists) {
            throw new NotFoundException('User not found');
        }

        return this.createTask(userId, createTaskDto);
    }

    private applyFilters(qb: SelectQueryBuilder<Task>, query: FindTasksQueryDto) {
        const search = query.q?.trim();
        if (search) {
            // Escape LIKE wildcards so user input is matched literally.
            const escaped = search.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`);
            qb.andWhere(
                `(LOWER(task.title) LIKE :search OR LOWER(COALESCE(task.description, '')) LIKE :search)`,
                { search: `%${escaped}%` },
            );
        }

        if (query.completed !== undefined) {
            qb.andWhere('task.completed = :completed', { completed: query.completed });
        }
    }

    createTask(userId: number, createTaskDto: CreateTaskDto) {
        const task = this.taskRepository.create({
            ...createTaskDto,
            userId,
        });
        return this.taskRepository.save(task);
    }

    async updateTask(
        id: number,
        userId: number,
        updateTaskDto: UpdateTaskDto,
    ) {
        const task = await this.taskRepository.findOne({
            where: { id, userId },
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        Object.assign(task, updateTaskDto);
        return this.taskRepository.save(task);
    }

    async deleteTask(id: number, userId: number) {
        const result = await this.taskRepository.delete({ id, userId });

        if (!result.affected) {
            throw new NotFoundException('Task not found');
        }

        return {
            message: 'Task deleted successfully',
        };
    }
}


