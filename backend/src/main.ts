import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import compression from "compression";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: ["error", "warn", "log"],
	});

	// Security
	app.use(helmet());
	app.use(compression());

	// CORS — allow coreq frontend
	app.enableCors({
		origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
		credentials: true,
	});

	// Validation
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	// Global prefix
	app.setGlobalPrefix("api/v1");

	// Swagger
	const config = new DocumentBuilder()
		.setTitle("Coreq API")
		.setDescription("Coreq HTTP Client REST API")
		.setVersion("1.0")
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api/docs", app, document);

	const port = process.env.PORT ?? 3001;
	await app.listen(port);
	console.log(`🚀 Coreq API running on http://localhost:${port}/api/v1`);
	console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
