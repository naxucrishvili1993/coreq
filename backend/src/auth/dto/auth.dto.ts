import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
	@ApiProperty({ example: "john@example.com" })
	@IsEmail()
	email: string;

	@ApiProperty({ example: "MyP@ssw0rd" })
	@IsString()
	@MinLength(8)
	@MaxLength(128)
	password: string;

	@ApiProperty({ example: "John Doe", required: false })
	@IsString()
	@MaxLength(100)
	name?: string;
}

export class LoginDto {
	@ApiProperty({ example: "john@example.com" })
	@IsEmail()
	email: string;

	@ApiProperty({ example: "MyP@ssw0rd" })
	@IsString()
	password: string;
}
