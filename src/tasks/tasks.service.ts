import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
    ) { }

    findAll(userId: number, query: FindTasksQueryDto = {}) {
        const qb = this.taskRepository
            .createQueryBuilder('task')
            .where('task.userId = :userId', { userId })
            .orderBy('task.id', 'ASC');

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

        return qb.getMany();
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


