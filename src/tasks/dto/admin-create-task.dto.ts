import { IsInt, Min } from 'class-validator';
import { CreateTaskDto } from './create-task.dto.js';

export class AdminCreateTaskDto extends CreateTaskDto {
    @IsInt()
    @Min(1)
    userId: number;
}
