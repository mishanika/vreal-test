import { IsString, IsOptional, IsBoolean } from "class-validator";

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
