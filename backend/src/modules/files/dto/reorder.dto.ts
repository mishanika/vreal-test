import { IsArray, IsString, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ReorderItemDto {
  @IsString()
  id: string;

  @IsNumber()
  order: number;
}

export class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
