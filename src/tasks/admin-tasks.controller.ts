import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { Role } from '../auth/role.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { TasksService } from './tasks.service.js';
import { AdminCreateTaskDto } from './dto/admin-create-task.dto.js';
import { AdminFindTasksQueryDto } from './dto/admin-find-tasks-query.dto.js';


@ApiTags('Admin - Tasks')
@Controller('admin/tasks')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
@ApiBasicAuth('basic')
export class AdminTasksController {

    constructor(
        private readonly tasksService: TasksService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List tasks of all users, optionally filtered by userId, search text or completed status' })
    getAllTasks(@Query() query: AdminFindTasksQueryDto) {
        return this.tasksService.findAllForAdmin(query);
    }

    @Post()
    @ApiOperation({ summary: 'Create a task for any user' })
    createTaskForUser(@Body() adminCreateTaskDto: AdminCreateTaskDto) {
        return this.tasksService.createTaskForUser(adminCreateTaskDto);
    }
}
