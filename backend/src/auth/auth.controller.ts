import { Controller, Post, Body, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post("login")
	login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@UseGuards(JwtAuthGuard)
	@Get("me")
	me(@CurrentUser("id") userId: string) {
		return this.authService.me(userId);
	}
}
