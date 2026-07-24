import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatMessageRole } from 'generated/prisma/enums';
import { GroqService } from 'src/ai/groq.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { RagService } from 'src/rag/rag.service';

@Injectable()
export class ChatService {
  private readonly minimunSimilarity = 0.7;
  constructor(
    private readonly prisma: PrismaService,
    private readonly groqService: GroqService,
    private readonly ragService: RagService,
  ) {}

  getConversation(userId: number) {
    return this.prisma.chatConversation.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getMessages(userId: number, conversationId: number) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.chatMessage.findMany({
      where: {
        conversationId,
      },
      select: {
        id: true,
        role: true,
        context: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private async getConversationOrThrow(userId: number, conversationId: number) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private extractTagName(message: string) {
    const match = message.match(
      /\btag\s+(?:là|la)?\s*["']?([^?"']+)["']?\??$/i,
    );

    return match?.[1]?.trim() ?? null;
  }

  private extractPostTitle(message: string) {
    const titleMatch = message.match(
      /(?:title|tiêu đề)\s+(?:là|la)\s+["']?(.+?)["']?\s*[?.]?$/i,
    );
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    const tagQuestionMatch = message.match(
      /(?:các\s+)?tags?\s+của\s+(?:bài viết|post)\s+["']?(.+?)["']?\s*[?.]?$/i,
    );

    return tagQuestionMatch?.[1].trim() ?? null;
  }

  private extractCategoryName(message: string) {
    const match = message.match(
      /(?:thuộc\s+)?(?:thể loại|category)\s+(?:là|la)?\s*["']?([^?"']+)["']?\s*[?.]?$/i,
    );

    return match?.[1].trim() ?? null;
  }

  private async findPostByTitle(title: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        title: {
          contains: title,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    return posts.map((posts) => ({
      ...posts,
      similarity: 1,
    }));
  }

  private async findPostByCategory(categoryName: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        category: {
          is: {
            name: {
              equals: categoryName,
              mode: 'insensitive',
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    return posts.map((posts) => ({
      ...posts,
      similarity: 1,
    }));
  }

  private async findPostByTag(tagName: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        tags: {
          some: {
            name: {
              equals: tagName,
              mode: 'insensitive',
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
    });
    return posts.map((posts) => ({
      ...posts,
      similarity: 1,
    }));
  }

  private async findRelevantPosts(message: string) {
    const matches = await this.ragService.searchSimilarPosts(message, 1);

    const postIds = matches
      .filter((match) => match.similarity >= this.minimunSimilarity)
      .map((match) => match.postId);

    const similarityByPostId = new Map(
      matches.map((match) => [match.postId, match.similarity]),
    );

    if (postIds.length === 0) {
      return [];
    }

    const posts = await this.prisma.post.findMany({
      where: {
        id: {
          in: postIds,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: {
          select: {
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    const postsById = new Map(posts.map((post) => [post.id, post]));

    return postIds.flatMap((postId) => {
      const post = postsById.get(postId);
      const similarity = similarityByPostId.get(postId);

      if (!post || similarity === undefined) {
        return [];
      }

      return [
        {
          ...post,
          similarity,
        },
      ];
    });
  }

  private buildPrompt(
    history: { role: ChatMessageRole; context: string }[],
    posts: {
      id: number;
      title: string;
      content: string;
      category: { name: string } | null;
      tags: { name: string }[];
    }[],
  ) {
    const historyText = history
      .map((message) => `${message.role}: ${message.context}`)
      .join('\n');

    const postContext =
      posts.length === 0
        ? 'Không có bài viết phù hợp trong hệ thống.'
        : posts
            .map(
              (post) => `
[POST ${post.id}]
Title: ${post.title}
Category: ${post.category?.name ?? 'None'}
Tags: ${post.tags.map((tag) => tag.name).join(', ') || 'None'}
Content: ${post.content.slice(0, 1000)}
`,
            )
            .join('\n');

    return `
Bạn là trợ lý AI của hệ thống quản lý bài viết.

Chỉ trả lời dựa trên POST CONTEXT bên dưới.
Không bịa title, id, category, tag hoặc nội dung không có trong context.
Nếu context không có thông tin phù hợp, hãy nói rõ:
"Chưa tìm thấy bài viết phù hợp trong hệ thống."
Nếu POST CONTEXT có ít nhất một bài viết, tuyệt đối không được nói
“Chưa tìm thấy bài viết phù hợp trong hệ thống”.
Phải trả lời dựa trên title, category, tags và content thực tế trong context.

POST CONTEXT:
${postContext}

CHAT HISTORY:
${historyText}
`;
  }
  async sendMessage(userId: number, sendMessageDto: SendMessageDto) {
    const context = sendMessageDto.message.trim();

    const conversation = sendMessageDto.conversationId
      ? await this.getConversationOrThrow(userId, sendMessageDto.conversationId)
      : await this.prisma.chatConversation.create({
          data: {
            userId,
            title: context.slice(0, 60),
          },
          select: {
            id: true,
            title: true,
          },
        });

    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: ChatMessageRole.USER,
        context,
      },
      select: {
        id: true,
        role: true,
        context: true,
        createdAt: true,
      },
    });

    const historyDescending = await this.prisma.chatMessage.findMany({
      where: {
        conversationId: conversation.id,
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        role: true,
        context: true,
      },
    });

    const history = [...historyDescending].reverse();

    const retrievalQuery = context;
    const tagName = this.extractTagName(context);
    const categoryName = tagName ? null : this.extractCategoryName(context);
    const postTitle =
      tagName || categoryName ? null : this.extractPostTitle(context);

    const relevantPosts = tagName
      ? await this.findPostByTag(tagName)
      : categoryName
        ? await this.findPostByCategory(categoryName)
        : postTitle
          ? await this.findPostByTitle(postTitle)
          : await this.findRelevantPosts(retrievalQuery);

    const prompt = this.buildPrompt(history, relevantPosts);

    const answer = await this.groqService.generateAnswer(prompt);

    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: ChatMessageRole.ASSISTANT,
        context: answer,
      },
      select: {
        id: true,
        role: true,
        context: true,
        createdAt: true,
      },
    });
    await this.prisma.chatConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return {
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
      sources: relevantPosts.map((post) => ({
        id: post.id,
        title: post.title,
        similarity: Number(post.similarity.toFixed(3)),
      })),
    };
  }
}
