import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CollectionsService } from "./collections.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("collections")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("collections")
export class CollectionsController {
	constructor(private readonly collectionsService: CollectionsService) {}

	@Get()
	findAll(@CurrentUser("id") userId: string, @Query("q") q?: string) {
		if (q) return this.collectionsService.search(userId, q);
		return this.collectionsService.findAll(userId);
	}

	@Get(":id")
	findOne(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.collectionsService.findOne(id, userId);
	}

	@Post()
	create(@CurrentUser("id") userId: string, @Body() dto: CreateCollectionDto) {
		return this.collectionsService.create(userId, dto);
	}

	@Patch(":id")
	update(
		@Param("id") id: string,
		@CurrentUser("id") userId: string,
		@Body() dto: UpdateCollectionDto,
	) {
		return this.collectionsService.update(id, userId, dto);
	}

	@Delete(":id")
	remove(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.collectionsService.remove(id, userId);
	}
}
