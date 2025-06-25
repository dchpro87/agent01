export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface RequestMetrics {
  startTime: number;
  endTime?: number;
  tokenUsage?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
  error?: string;
}

export class AILogger {
  private static metrics: Map<string, RequestMetrics> = new Map();

  static startRequest(requestId: string, modelId: string): void {
    console.log(`🚀 Starting AI request ${requestId} with model: ${modelId}`);
    this.metrics.set(requestId, {
      startTime: Date.now(),
    });
  }

  static finishRequest(
    requestId: string,
    usage?: TokenUsage,
    error?: Error
  ): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.endTime = Date.now();
      if (usage) {
        metrics.tokenUsage = {
          prompt: usage.promptTokens,
          completion: usage.completionTokens,
          total: usage.totalTokens,
        };
      }
      if (error) {
        metrics.error = error.message;
        console.error(`❌ AI request ${requestId} failed:`, error.message);
      } else {
        const duration = metrics.endTime - metrics.startTime;
        console.log(`✅ AI request ${requestId} completed in ${duration}ms`);
        if (metrics.tokenUsage) {
          console.log(`📊 Token usage:`, metrics.tokenUsage);
        }
      }
      this.metrics.delete(requestId);
    }
  }
}

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
