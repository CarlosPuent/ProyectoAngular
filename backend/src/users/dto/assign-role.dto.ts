import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ example: 'ADMIN', enum: ['ADMIN', 'USER'] })
  @IsString()
  @IsIn(['ADMIN', 'USER'], { message: 'Role must be ADMIN or USER' })
  role: string;
}