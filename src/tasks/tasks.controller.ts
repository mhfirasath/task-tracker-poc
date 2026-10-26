import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/jwt.strategy.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';


@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class TasksController {

    constructor(
        private readonly tasksService: TasksService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List your tasks, optionally filtered by search text or completed status' })
    getTasks(
        @Req() request: AuthenticatedRequest,
        @Query() query: FindTasksQueryDto,
    ) {
        return this.tasksService.findAll(request.user.sub, query);
    }


    @Post()
    @ApiOperation({ summary: 'Create a task' })
    createTask(
        @Req() request: AuthenticatedRequest,
        @Body() createTaskDto: CreateTaskDto,
    ) {
        return this.tasksService.createTask(request.user.sub, createTaskDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update one of your tasks' })
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
    @ApiOperation({ summary: 'Delete one of your tasks' })
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


