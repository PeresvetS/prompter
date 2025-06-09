import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { TelegramModule } from './telegram/telegram.module';
import { UserModule } from './user/user.module';
import { OpenAIModule } from './openai/openai.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AdminModule } from './admin/admin.module';
import { CustomLoggerService } from './common/logger.service';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { RequestLoggingMiddleware } from './common/request-logging.middleware';
import { GracefulShutdownService } from './common/graceful-shutdown.service';
import { SecurityService } from './common/security.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TelegramModule,
    UserModule,
    OpenAIModule,
    SubscriptionModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    CustomLoggerService,
    SecurityService,
    GracefulShutdownService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [PrismaService, CustomLoggerService, SecurityService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
