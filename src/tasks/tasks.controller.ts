import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';


@Controller('tasks')
export class TasksController {

    constructor(
        private readonly tasksService: TasksService,
    ) { }

    @Get()
    getTasks() {
        return this.tasksService.findAll();
        }


    @Post()
    createTask(
        @Body() createTaskDto: CreateTaskDto,
    ) {
        return this.tasksService.createTask(createTaskDto);
    }

    @Patch(':id')
    updateTask(
        @Param('id') id: number,
        @Body() updateTaskDto: UpdateTaskDto,
    ) {
        return this.tasksService.updateTask(
            Number(id),
            updateTaskDto,
        );
    }

    @Delete(':id')
    deleteTask(
        @Param('id') id: number,
    ) {
        return this.tasksService.deleteTask(
            Number(id),
        );
    }


}


