import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { EnvironmentsService } from "./environments.service";
import {
	CreateEnvironmentDto,
	UpdateEnvironmentDto,
	CreateVariableDto,
} from "./dto/create-environment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("environments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("environments")
export class EnvironmentsController {
	constructor(private readonly environmentsService: EnvironmentsService) {}

	@Get()
	findAll(@CurrentUser("id") userId: string) {
		return this.environmentsService.findAll(userId);
	}

	@Get(":id")
	findOne(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.environmentsService.findOne(id, userId);
	}

	@Post()
	create(@CurrentUser("id") userId: string, @Body() dto: CreateEnvironmentDto) {
		return this.environmentsService.create(userId, dto);
	}

	@Patch(":id")
	update(
		@Param("id") id: string,
		@CurrentUser("id") userId: string,
		@Body() dto: UpdateEnvironmentDto,
	) {
		return this.environmentsService.update(id, userId, dto);
	}

	@Post(":id/variables")
	upsertVariable(
		@Param("id") id: string,
		@CurrentUser("id") userId: string,
		@Body() dto: CreateVariableDto,
	) {
		return this.environmentsService.upsertVariable(id, userId, dto);
	}

	@Delete(":id/variables/:key")
	deleteVariable(
		@Param("id") id: string,
		@Param("key") key: string,
		@CurrentUser("id") userId: string,
	) {
		return this.environmentsService.deleteVariable(id, key, userId);
	}

	@Delete(":id")
	remove(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.environmentsService.remove(id, userId);
	}
}
