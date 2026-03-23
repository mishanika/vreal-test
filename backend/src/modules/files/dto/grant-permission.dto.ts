import { IsString } from "class-validator";
import { PermissionLevel } from "../../../entities/permission.entity";

export class GrantPermissionDto {
  @IsString()
  email: string;

  @IsString()
  level: PermissionLevel;
}
