import { ConfigService } from '@nestjs/config';
export declare class OpenAIService {
    private configService;
    private readonly logger;
    private openai;
    private assistantId;
    constructor(configService: ConfigService);
    createThread(): Promise<string>;
    processMessage(threadId: string, message: string): Promise<string>;
    private waitForRunCompletion;
    transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string>;
    private getAudioMimeType;
    checkHealth(): Promise<boolean>;
}
