import { Injectable } from '@nestjs/common';
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

    findAll() {
        return this.taskRepository.find();
    }

    createTask(createTaskDto: CreateTaskDto) {
        const task = this.taskRepository.create(createTaskDto);
        return this.taskRepository.save(task);
    }

    async updateTask(
        id: number,
        updateTaskDto: UpdateTaskDto,
    ) {
        await this.taskRepository.update(id, updateTaskDto);

        return this.taskRepository.findOne({
            where: { id },
        });
    }

    deleteTask(id: number) {
        return this.taskRepository.delete(id);
    }
}


