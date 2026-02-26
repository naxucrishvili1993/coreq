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
import { RequestsService } from "./requests.service";
import { CreateRequestDto, UpdateRequestDto } from "./dto/create-request.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("requests")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("requests")
export class RequestsController {
	constructor(private readonly requestsService: RequestsService) {}

	@Get()
	findAll(
		@CurrentUser("id") userId: string,
		@Query("collectionId") collectionId?: string,
	) {
		return this.requestsService.findAll(userId, collectionId);
	}

	@Get(":id")
	findOne(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.requestsService.findOne(id, userId);
	}

	@Post()
	create(@CurrentUser("id") userId: string, @Body() dto: CreateRequestDto) {
		return this.requestsService.create(userId, dto);
	}

	@Patch(":id")
	update(
		@Param("id") id: string,
		@CurrentUser("id") userId: string,
		@Body() dto: UpdateRequestDto,
	) {
		return this.requestsService.update(id, userId, dto);
	}

	@Delete(":id")
	remove(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.requestsService.remove(id, userId);
	}
}
