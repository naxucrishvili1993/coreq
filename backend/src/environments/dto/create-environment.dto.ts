import {
	IsString,
	IsOptional,
	IsArray,
	IsBoolean,
	MaxLength,
	ValidateNested,
} from "class-validator";
import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateVariableDto {
	@ApiProperty() @IsString() @MaxLength(255) key: string;
	@ApiProperty() @IsString() value: string;
	@IsOptional() @IsBoolean() isSecret?: boolean;
	@IsOptional() @IsBoolean() enabled?: boolean;
}

export class CreateEnvironmentDto {
	@ApiProperty() @IsString() @MaxLength(255) name: string;
	@IsOptional() @IsString() baseUrl?: string;
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateVariableDto)
	variables?: CreateVariableDto[];
}

export class UpdateEnvironmentDto extends PartialType(CreateEnvironmentDto) {}
