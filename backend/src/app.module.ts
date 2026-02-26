import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { CollectionsModule } from "./collections/collections.module";
import { RequestsModule } from "./requests/requests.module";
import { EnvironmentsModule } from "./environments/environments.module";
import { HistoryModule } from "./history/history.module";
import { SearchModule } from "./search/search.module";

@Module({
	imports: [
		// Config (loads .env)
		ConfigModule.forRoot({ isGlobal: true }),

		// Rate limiting
		ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

		// Database
		PrismaModule,

		// Feature modules
		AuthModule,
		CollectionsModule,
		RequestsModule,
		EnvironmentsModule,
		HistoryModule,
		SearchModule,
	],
})
export class AppModule {}
