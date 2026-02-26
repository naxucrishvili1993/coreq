import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

@Injectable()
export class CollectionsService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(userId: string) {
		return this.prisma.collection.findMany({
			where: { userId },
			include: {
				_count: { select: { requests: true, folders: true } },
			},
			orderBy: { updatedAt: "desc" },
		});
	}

	async findOne(id: string, userId: string) {
		const collection = await this.prisma.collection.findFirst({
			where: { id, userId },
			include: {
				folders: {
					include: {
						requests: { include: { headers: true, params: true } },
					},
				},
				requests: {
					where: { folderId: null },
					include: { headers: true, params: true },
				},
			},
		});
		if (!collection) throw new NotFoundException("Collection not found");
		return collection;
	}

	async create(userId: string, dto: CreateCollectionDto) {
		return this.prisma.collection.create({
			data: { ...dto, userId },
		});
	}

	async update(id: string, userId: string, dto: UpdateCollectionDto) {
		await this.findOne(id, userId);
		return this.prisma.collection.update({
			where: { id },
			data: dto,
		});
	}

	async remove(id: string, userId: string) {
		await this.findOne(id, userId);
		return this.prisma.collection.delete({ where: { id } });
	}

	// ── Full-text + trigram search ────────────────────────────────────────────
	async search(userId: string, query: string) {
		if (!query.trim()) return [];
		return this.prisma.$queryRaw<{ id: string; name: string; rank: number }[]>`
      SELECT id, name,
        ts_rank(search_vec, plainto_tsquery('english', ${query})) AS rank
      FROM collections
      WHERE user_id = ${userId}::uuid
        AND (
          search_vec @@ plainto_tsquery('english', ${query})
          OR name % ${query}
        )
      ORDER BY rank DESC
      LIMIT 10
    `;
	}
}
