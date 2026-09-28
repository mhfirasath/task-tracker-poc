import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
    ) { }

    findAll(userId: number) {
        return this.taskRepository.find({
            where: { userId },
        });
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


