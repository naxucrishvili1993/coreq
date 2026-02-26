import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface SearchResult {
	id: string;
	type: "collection" | "request" | "environment" | "history";
	name: string;
	subtitle?: string;
	rank: number;
}

@Injectable()
export class SearchService {
	constructor(private readonly prisma: PrismaService) {}

	async globalSearch(userId: string, query: string): Promise<SearchResult[]> {
		if (!query.trim()) return [];

		const [collections, requests, environments] = await Promise.all([
			this.prisma.$queryRaw<SearchResult[]>`
        SELECT id, 'collection' AS type, name,
          description AS subtitle,
          ts_rank(search_vec, plainto_tsquery('english', ${query})) AS rank
        FROM collections
        WHERE user_id = ${userId}::uuid
          AND (search_vec @@ plainto_tsquery('english', ${query}) OR name % ${query})
        ORDER BY rank DESC LIMIT 5
      `,
			this.prisma.$queryRaw<SearchResult[]>`
        SELECT id, 'request' AS type, name,
          url AS subtitle,
          ts_rank(search_vec, plainto_tsquery('english', ${query})) AS rank
        FROM requests
        WHERE user_id = ${userId}::uuid
          AND (search_vec @@ plainto_tsquery('english', ${query}) OR name % ${query} OR url % ${query})
        ORDER BY rank DESC LIMIT 10
      `,
			this.prisma.$queryRaw<SearchResult[]>`
        SELECT id, 'environment' AS type, name,
          NULL AS subtitle,
          similarity(name, ${query}) AS rank
        FROM environments
        WHERE user_id = ${userId}::uuid
          AND name % ${query}
        ORDER BY rank DESC LIMIT 5
      `,
		]);

		return [...collections, ...requests, ...environments].sort(
			(a, b) => b.rank - a.rank,
		);
	}
}
