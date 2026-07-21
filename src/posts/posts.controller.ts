import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseFilePipeBuilder,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ShearchPostDto } from './dto/shearch-post.dto';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create post' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() request: Request & { user: JwtPayload },
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(request.user.sub, createPostDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload image ' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'string',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @Post(':id/image')
  uploadImage(
    @Req() request: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) postId: number,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /image\/(jpeg|png|webp)/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.postsService.uploadImage(request.user.sub, postId, file);
  }

  @ApiOperation({ summary: 'get all posts' })
  @ApiQuery({
    name: 'q',
    required: false,
    example: 'shearch input',
    description: 'Shearch keyword in post title',
  })
  @Get()
  findAll(@Query() shearchPostDto: ShearchPostDto) {
    return this.postsService.findAll(shearchPostDto);
  }

  @ApiOperation({
    summary: 'Get url image post',
  })
  @Get(':id/image-url')
  getImageUrl(@Param('id', ParseIntPipe) postId: number) {
    return this.postsService.getImageUrl(postId);
  }

  @ApiOperation({ summary: 'get post detail' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) postId: number) {
    return this.postsService.findOne(postId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update post' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() request: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(request.user.sub, postId, updatePostDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete post' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Req() request: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.remove(request.user.sub, postId);
  }
}
