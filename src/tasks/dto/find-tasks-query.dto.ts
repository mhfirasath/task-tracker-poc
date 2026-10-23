import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class FindTasksQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    q?: string;

    // Query strings arrive as "true" / "false", so convert them before validating.
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    completed?: boolean;
}
