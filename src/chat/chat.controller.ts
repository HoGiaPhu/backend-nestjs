import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: 'get current user chat conversation' })
  @Get('conversations')
  getConversations(@Req() request: Request & { user: JwtPayload }) {
    return this.chatService.getConversation(request.user.sub);
  }

  @ApiOperation({ summary: 'send a message to ai bot' })
  @Post()
  sendMessage(
    @Req() request: Request & { user: JwtPayload },
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(request.user.sub, sendMessageDto);
  }

  @ApiOperation({ summary: 'get message in a conversation of currnent usser' })
  @Get('conversations/:id/messages')
  getMessages(
    @Req() request: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) conversationsId: number,
  ) {
    return this.chatService.getMessages(request.user.sub, conversationsId);
  }
}
