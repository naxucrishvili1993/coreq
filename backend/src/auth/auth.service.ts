import {
	Injectable,
	ConflictException,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
	) {}

	async register(dto: RegisterDto) {
		const exists = await this.prisma.user.findUnique({
			where: { email: dto.email },
		});
		if (exists) throw new ConflictException("Email already in use");

		const hash = await bcrypt.hash(dto.password, 12);
		const user = await this.prisma.user.create({
			data: { email: dto.email, passwordHash: hash, name: dto.name },
			select: { id: true, email: true, name: true, createdAt: true },
		});

		const token = this.sign(user.id, user.email);
		return { user, access_token: token };
	}

	async login(dto: LoginDto) {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email },
		});
		if (!user) throw new UnauthorizedException("Invalid credentials");

		const valid = await bcrypt.compare(dto.password, user.passwordHash);
		if (!valid) throw new UnauthorizedException("Invalid credentials");

		const token = this.sign(user.id, user.email);
		return {
			user: { id: user.id, email: user.email, name: user.name },
			access_token: token,
		};
	}

	async me(userId: string) {
		return this.prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, email: true, name: true, createdAt: true },
		});
	}

	private sign(sub: string, email: string) {
		return this.jwt.sign({ sub, email });
	}
}
