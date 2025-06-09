"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OpenAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
let OpenAIService = OpenAIService_1 = class OpenAIService {
    configService;
    logger = new common_1.Logger(OpenAIService_1.name);
    openai;
    assistantId;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        const assistantId = this.configService.get('OPENAI_ASSISTANT_ID');
        if (!apiKey) {
            this.logger.error('OPENAI_API_KEY is not provided');
            return;
        }
        if (!assistantId) {
            this.logger.error('OPENAI_ASSISTANT_ID is not provided');
            return;
        }
        this.assistantId = assistantId;
        this.openai = new openai_1.default({ apiKey });
        this.logger.log('OpenAI Assistant client initialized');
    }
    async createThread() {
        try {
            const thread = await this.openai.beta.threads.create();
            this.logger.debug(`Created new OpenAI thread: ${thread.id}`);
            return thread.id;
        }
        catch (error) {
            this.logger.error('Error creating OpenAI thread:', error);
            throw error;
        }
    }
    async processMessage(threadId, message) {
        try {
            this.logger.debug(`Processing message in thread ${threadId}: ${message}`);
            await this.openai.beta.threads.messages.create(threadId, {
                role: 'user',
                content: message,
            });
            const run = await this.openai.beta.threads.runs.create(threadId, {
                assistant_id: this.assistantId,
            });
            const completedRun = await this.waitForRunCompletion(threadId, run.id);
            if (completedRun.status === 'completed') {
                const messages = await this.openai.beta.threads.messages.list(threadId, {
                    limit: 1,
                    order: 'desc',
                });
                const lastMessage = messages.data[0];
                if (lastMessage?.content[0]?.type === 'text') {
                    const response = lastMessage.content[0].text.value;
                    this.logger.debug(`OpenAI Assistant response: ${response}`);
                    return response;
                }
            }
            this.logger.error(`Run failed with status: ${completedRun.status}`);
            return 'Sorry, I encountered an issue processing your request. Please try again.';
        }
        catch (error) {
            this.logger.error('Error processing message with OpenAI Assistant:', error);
            throw error;
        }
    }
    async waitForRunCompletion(threadId, runId) {
        const maxAttempts = 30;
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                const run = await this.openai.beta.threads.runs.retrieve(runId, {
                    thread_id: threadId,
                });
                if (run.status === 'completed' ||
                    run.status === 'failed' ||
                    run.status === 'cancelled') {
                    return run;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
                attempts++;
            }
            catch (error) {
                this.logger.error('Error checking run status:', error);
                throw error;
            }
        }
        throw new Error('Run timeout - assistant took too long to respond');
    }
    async transcribeAudio(audioBuffer, filename) {
        try {
            this.logger.debug(`Начинаем расшифровку аудио файла: ${filename}`);
            const audioFile = new File([audioBuffer], filename, {
                type: this.getAudioMimeType(filename),
            });
            const transcription = await this.openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                language: 'ru',
                response_format: 'text',
            });
            this.logger.debug(`Аудио расшифровано: ${transcription}`);
            return transcription;
        }
        catch (error) {
            this.logger.error('Ошибка при расшифровке аудио:', error);
            throw new Error('Не удалось расшифровать аудио сообщение');
        }
    }
    getAudioMimeType(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
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
    async checkHealth() {
        try {
            await this.openai.beta.assistants.retrieve(this.assistantId);
            return true;
        }
        catch (error) {
            this.logger.error('OpenAI Assistant health check failed:', error);
            return false;
        }
    }
};
exports.OpenAIService = OpenAIService;
exports.OpenAIService = OpenAIService = OpenAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAIService);
//# sourceMappingURL=openai.service.js.map