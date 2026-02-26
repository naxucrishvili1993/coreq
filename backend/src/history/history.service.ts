import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HistoryService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(userId: string, page = 1, limit = 50) {
		const skip = (page - 1) * limit;
		const [items, total] = await Promise.all([
			this.prisma.requestHistory.findMany({
				where: { userId },
				orderBy: { executedAt: "desc" },
				skip,
				take: limit,
			}),
			this.prisma.requestHistory.count({ where: { userId } }),
		]);
		return { items, total, page, limit, pages: Math.ceil(total / limit) };
	}

	async add(
		userId: string,
		data: {
			method: string;
			url: string;
			statusCode?: number;
			durationMs?: number;
			requestData: object;
			responseData?: object;
		},
	) {
		// Keep only last 200 entries per user
		const count = await this.prisma.requestHistory.count({ where: { userId } });
		if (count >= 200) {
			const oldest = await this.prisma.requestHistory.findFirst({
				where: { userId },
				orderBy: { executedAt: "asc" },
				select: { id: true },
			});
			if (oldest)
				await this.prisma.requestHistory.delete({ where: { id: oldest.id } });
		}
		return this.prisma.requestHistory.create({
			data: { userId, ...data },
		});
	}

	async remove(id: string, userId: string) {
		return this.prisma.requestHistory.deleteMany({ where: { id, userId } });
	}

	async clear(userId: string) {
		return this.prisma.requestHistory.deleteMany({ where: { userId } });
	}
}
