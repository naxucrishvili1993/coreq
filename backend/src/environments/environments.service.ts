import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
	CreateEnvironmentDto,
	UpdateEnvironmentDto,
	CreateVariableDto,
} from "./dto/create-environment.dto";

@Injectable()
export class EnvironmentsService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(userId: string) {
		return this.prisma.environment.findMany({
			where: { userId },
			include: { variables: true },
			orderBy: { updatedAt: "desc" },
		});
	}

	async findOne(id: string, userId: string) {
		const env = await this.prisma.environment.findFirst({
			where: { id, userId },
			include: { variables: true },
		});
		if (!env) throw new NotFoundException("Environment not found");
		return env;
	}

	async create(userId: string, dto: CreateEnvironmentDto) {
		const { variables = [], ...rest } = dto;
		return this.prisma.environment.create({
			data: {
				...rest,
				userId,
				variables: { create: variables.map((v) => ({ ...v })) },
			},
			include: { variables: true },
		});
	}

	async update(id: string, userId: string, dto: UpdateEnvironmentDto) {
		await this.findOne(id, userId);
		const { variables, ...rest } = dto;
		if (variables !== undefined) {
			await this.prisma.$transaction(async (tx) => {
				await tx.environmentVariable.deleteMany({
					where: { environmentId: id },
				});
				await tx.environmentVariable.createMany({
					data: variables.map((v) => ({ ...v, environmentId: id })),
				});
				await tx.environment.update({ where: { id }, data: rest });
			});
			return this.findOne(id, userId);
		}
		return this.prisma.environment.update({
			where: { id },
			data: rest,
			include: { variables: true },
		});
	}

	async upsertVariable(envId: string, userId: string, dto: CreateVariableDto) {
		await this.findOne(envId, userId);
		return this.prisma.environmentVariable.upsert({
			where: { environmentId_key: { environmentId: envId, key: dto.key } },
			create: { ...dto, environmentId: envId },
			update: dto,
		});
	}

	async deleteVariable(envId: string, key: string, userId: string) {
		await this.findOne(envId, userId);
		return this.prisma.environmentVariable.delete({
			where: { environmentId_key: { environmentId: envId, key } },
		});
	}

	async remove(id: string, userId: string) {
		await this.findOne(id, userId);
		return this.prisma.environment.delete({ where: { id } });
	}
}
