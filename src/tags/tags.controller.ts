import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'generated/prisma/enums';
import { CreateTagDto } from './dto/create-tag.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiOperation({ summary: 'Get all tags' })
  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'create tag' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update tag' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) tagId: number,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(tagId, updateTagDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'delete tag' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) tagId: number) {
    return this.tagsService.remove(tagId);
  }
}
