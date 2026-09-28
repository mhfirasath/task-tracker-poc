import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/jwt.strategy.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';


@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class TasksController {

    constructor(
        private readonly tasksService: TasksService,
    ) { }

    @Get()
    getTasks(@Req() request: AuthenticatedRequest) {
        return this.tasksService.findAll(request.user.sub);
        }


    @Post()
    createTask(
        @Req() request: AuthenticatedRequest,
        @Body() createTaskDto: CreateTaskDto,
    ) {
        return this.tasksService.createTask(request.user.sub, createTaskDto);
    }

    @Patch(':id')
    updateTask(
        @Req() request: AuthenticatedRequest,
        @Param('id') id: number,
        @Body() updateTaskDto: UpdateTaskDto,
    ) {
        return this.tasksService.updateTask(
            Number(id),
            request.user.sub,
            updateTaskDto,
        );
    }

    @Delete(':id')
    deleteTask(
        @Req() request: AuthenticatedRequest,
        @Param('id') id: number,
    ) {
        return this.tasksService.deleteTask(
            Number(id),
            request.user.sub,
        );
    }


}

type AuthenticatedRequest = Request & {
    user: JwtPayload;
};


