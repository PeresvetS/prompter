import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private assistantId: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const assistantId = this.configService.get<string>('OPENAI_ASSISTANT_ID');

    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not provided');
      return;
    }

    if (!assistantId) {
      this.logger.error('OPENAI_ASSISTANT_ID is not provided');
      return;
    }

    this.assistantId = assistantId;
    this.openai = new OpenAI({ apiKey });
    this.logger.log('OpenAI Assistant client initialized');
  }

  async createThread(): Promise<string> {
    try {
      const thread = await this.openai.beta.threads.create();
      this.logger.debug(`Created new OpenAI thread: ${thread.id}`);
      return thread.id;
    } catch (error) {
      this.logger.error('Error creating OpenAI thread:', error);
      throw error;
    }
  }

  async processMessage(threadId: string, message: string): Promise<string> {
    try {
      this.logger.debug(`Processing message in thread ${threadId}: ${message}`);

      // Add user message to thread
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
      });

      // Create and run assistant
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
      });

      // Wait for completion
      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      if (completedRun.status === 'completed') {
        // Get the assistant's response
        const messages = await this.openai.beta.threads.messages.list(
          threadId,
          {
            limit: 1,
            order: 'desc',
          },
        );

        const lastMessage = messages.data[0];
        if (lastMessage?.content[0]?.type === 'text') {
          const response = lastMessage.content[0].text.value;
          this.logger.debug(`OpenAI Assistant response: ${response}`);
          return response;
        }
      }

      this.logger.error(`Run failed with status: ${completedRun.status}`);
      return 'Sorry, I encountered an issue processing your request. Please try again.';
    } catch (error) {
      this.logger.error(
        'Error processing message with OpenAI Assistant:',
        error,
      );
      throw error;
    }
  }

  private async waitForRunCompletion(
    threadId: string,
    runId: string,
  ): Promise<any> {
    const maxAttempts = 30; // 30 seconds max wait
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const run = await this.openai.beta.threads.runs.retrieve(runId, {
          thread_id: threadId,
        });

        if (
          run.status === 'completed' ||
          run.status === 'failed' ||
          run.status === 'cancelled'
        ) {
          return run;
        }

        // Wait 1 second before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        this.logger.error('Error checking run status:', error);
        throw error;
      }
    }

    throw new Error('Run timeout - assistant took too long to respond');
  }

  /**
   * Расшифровывает аудио файл с помощью Whisper API
   * @param audioBuffer - Буфер с аудио данными
   * @param filename - Имя файла (для определения формата)
   * @returns Расшифрованный текст
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    try {
      this.logger.debug(`Начинаем расшифровку аудио файла: ${filename}`);

      // Создаем File объект из буфера
      const audioFile = new File([audioBuffer], filename, {
        type: this.getAudioMimeType(filename),
      });

      // Отправляем в Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'ru', // Указываем русский язык для лучшего качества
        response_format: 'text',
      });

      this.logger.debug(`Аудио расшифровано: ${transcription}`);
      return transcription;
    } catch (error) {
      this.logger.error('Ошибка при расшифровке аудио:', error);
      throw new Error('Не удалось расшифровать аудио сообщение');
    }
  }

  /**
   * Определяет MIME тип по расширению файла
   * @param filename - Имя файла
   * @returns MIME тип
   */
  private getAudioMimeType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      oga: 'audio/ogg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      flac: 'audio/flac',
    };
    return mimeTypes[extension || ''] || 'audio/mpeg';
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Check if we can access the assistant
      await this.openai.beta.assistants.retrieve(this.assistantId);
      return true;
    } catch (error) {
      this.logger.error('OpenAI Assistant health check failed:', error);
      return false;
    }
  }
}
