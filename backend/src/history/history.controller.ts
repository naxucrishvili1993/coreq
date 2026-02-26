import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	Query,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { HistoryService } from "./history.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("history")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("history")
export class HistoryController {
	constructor(private readonly historyService: HistoryService) {}

	@Get()
	findAll(
		@CurrentUser("id") userId: string,
		@Query("page") page = "1",
		@Query("limit") limit = "50",
	) {
		return this.historyService.findAll(userId, +page, +limit);
	}

	@Post()
	add(@CurrentUser("id") userId: string, @Body() data: any) {
		return this.historyService.add(userId, data);
	}

	@Delete("all")
	clear(@CurrentUser("id") userId: string) {
		return this.historyService.clear(userId);
	}

	@Delete(":id")
	remove(@Param("id") id: string, @CurrentUser("id") userId: string) {
		return this.historyService.remove(id, userId);
	}
}
