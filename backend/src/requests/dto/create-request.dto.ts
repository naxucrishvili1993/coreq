import {
	IsString,
	IsEnum,
	IsOptional,
	IsArray,
	IsObject,
	MaxLength,
	ValidateNested,
} from "class-validator";
import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class KVPairDto {
	@IsString() key: string;
	@IsString() value: string;
	@IsOptional() @IsString() description?: string;
	@IsOptional() enabled?: boolean;
}

export class AuthDto {
	@IsString() type: string;
	@IsOptional() @IsString() token?: string;
	@IsOptional() @IsString() username?: string;
	@IsOptional() @IsString() password?: string;
	@IsOptional() @IsString() headerName?: string;
	@IsOptional() @IsString() apiKey?: string;
}

export class RequestBodyDto {
	@IsString() type: string;
	@IsOptional() @IsString() content?: string;
	@IsOptional() @IsArray() formData?: KVPairDto[];
}

export class CreateRequestDto {
	@ApiProperty() @IsString() @MaxLength(255) name: string;

	@ApiProperty()
	@IsEnum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
	method: string;

	@ApiProperty() @IsString() url: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	collectionId?: string;
	@ApiProperty({ required: false }) @IsOptional() @IsString() folderId?: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => KVPairDto)
	headers?: KVPairDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => KVPairDto)
	params?: KVPairDto[];

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => RequestBodyDto)
	body?: RequestBodyDto;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => AuthDto)
	auth?: AuthDto;

	@IsOptional() @IsString() description?: string;
}

export class UpdateRequestDto extends PartialType(CreateRequestDto) {}
