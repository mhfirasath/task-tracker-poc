import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { FindTasksQueryDto } from './find-tasks-query.dto.js';

export class AdminFindTasksQueryDto extends FindTasksQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    userId?: number;
}
