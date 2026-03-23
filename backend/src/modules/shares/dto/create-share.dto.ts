import { IsString, IsOptional } from "class-validator";

export class CreateShareDto {
  @IsString()
  fileNodeId: string;

  @IsOptional()
  @IsString()
  email?: string;
}
