import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRequestDto, UpdateRequestDto } from "./dto/create-request.dto";

@Injectable()
export class RequestsService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(userId: string, collectionId?: string) {
		return this.prisma.request.findMany({
			where: { userId, ...(collectionId ? { collectionId } : {}) },
			include: { headers: true, params: true },
			orderBy: { updatedAt: "desc" },
		});
	}

	async findOne(id: string, userId: string) {
		const request = await this.prisma.request.findFirst({
			where: { id, userId },
			include: { headers: true, params: true },
		});
		if (!request) throw new NotFoundException("Request not found");
		return request;
	}

	async create(userId: string, dto: CreateRequestDto) {
		const { headers = [], params = [], body, auth, ...rest } = dto;
		return this.prisma.request.create({
			data: {
				...rest,
				userId,
				bodyType: body?.type,
				bodyContent: body?.content,
				authType: auth?.type,
				authData: auth as object,
				headers: {
					create: headers.map((h) => ({ ...h })),
				},
				params: {
					create: params.map((p) => ({ ...p })),
				},
			},
			include: { headers: true, params: true },
		});
	}

	async update(id: string, userId: string, dto: UpdateRequestDto) {
		await this.findOne(id, userId);
		const { headers, params, body, auth, ...rest } = dto;

		await this.prisma.$transaction(async (tx) => {
			if (headers !== undefined) {
				await tx.requestHeader.deleteMany({ where: { requestId: id } });
				await tx.requestHeader.createMany({
					data: headers.map((h) => ({ ...h, requestId: id })),
				});
			}
			if (params !== undefined) {
				await tx.requestParam.deleteMany({ where: { requestId: id } });
				await tx.requestParam.createMany({
					data: params.map((p) => ({ ...p, requestId: id })),
				});
			}
			await tx.request.update({
				where: { id },
				data: {
					...rest,
					...(body !== undefined
						? { bodyType: body.type, bodyContent: body.content }
						: {}),
					...(auth !== undefined
						? { authType: auth.type, authData: auth as object }
						: {}),
				},
			});
		});

		return this.findOne(id, userId);
	}

	async remove(id: string, userId: string) {
		await this.findOne(id, userId);
		return this.prisma.request.delete({ where: { id } });
	}
}
