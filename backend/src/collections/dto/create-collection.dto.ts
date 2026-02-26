import { IsString, IsOptional, MaxLength, IsHexColor } from "class-validator";
import { ApiProperty, PartialType } from "@nestjs/swagger";

export class CreateCollectionDto {
	@ApiProperty({ example: "My API Collection" })
	@IsString()
	@MaxLength(255)
	name: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({ required: false, example: "#3b82f6" })
	@IsOptional()
	@IsHexColor()
	color?: string;
}

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}
