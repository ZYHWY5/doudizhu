// AI API 集成 - 使用 Groq API 优化 AI 对手
export interface AIDecisionContext {
  // 游戏状态
  phase: 'bidding' | 'multiplier' | 'playing'
  currentCards: string[]
  playedCards: string[]
  remainingCards: { [playerId: string]: number }
  
  // 玩家信息
  playerId: string
  playerRole: 'landlord' | 'farmer' | null
  
  // 历史信息
  biddingHistory: Array<{ playerId: string; bid: string }>
  multiplierHistory: Array<{ playerId: string; action: string }>
  playHistory: Array<{ playerId: string; cards: string[] }>
  
  // AI 个性
  personality: 'aggressive' | 'conservative' | 'balanced' | 'unpredictable'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
}

export interface AIDecisionResponse {
  decision: string
  confidence: number
  reasoning: string
  fallback?: string
}

class GroqAIService {
  private apiKey: string = ''
  private baseURL = 'https://api.groq.com/openai/v1'
  private model = 'llama2-70b-4096' // 或 'mixtral-8x7b-32768'
  private requestCount = 0
  private dailyLimit = 14000 // 保留一些余量

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ''
  }

  setApiKey(key: string): void {
    this.apiKey = key
  }

  async makeDecision(context: AIDecisionContext): Promise<AIDecisionResponse | null> {
    // 检查API密钥
    if (!this.apiKey) {
      console.log('🤖 AI API密钥未设置，使用本地规则AI')
      return null
    }

    // 检查请求限制
    if (this.requestCount >= this.dailyLimit) {
      console.log('🤖 AI API今日请求已达上限，使用本地规则AI')
      return null
    }

    try {
      const prompt = this.buildPrompt(context)
      const response = await this.callGroqAPI(prompt)
      
      if (response) {
        this.requestCount++
        return this.parseResponse(response)
      }
    } catch (error) {
      console.error('🤖 AI API调用失败:', error)
    }

    return null
  }

  private buildPrompt(context: AIDecisionContext): string {
    const { phase, currentCards, playerId, playerRole, personality, difficulty } = context

    let prompt = `你是一个斗地主游戏的AI玩家，具有以下特征：
- 个性: ${personality} (aggressive=激进, conservative=保守, balanced=平衡, unpredictable=不可预测)
- 难度: ${difficulty}
- 角色: ${playerRole || '未确定'}
- 当前手牌: ${currentCards.join(', ')}

当前游戏阶段: ${phase}

`

    if (phase === 'bidding') {
      prompt += `请决定是否叫地主。选项: "call"(叫地主), "pass"(不叫), "grab"(抢地主)
考虑因素:
1. 手牌强度
2. 个性特征
3. 风险偏好

请返回JSON格式: {"decision": "call/pass/grab", "confidence": 0.8, "reasoning": "决策理由"}`
    } else if (phase === 'multiplier') {
      prompt += `请决定是否加倍。选项: "double"(加倍), "pass"(不加倍)
考虑因素:
1. 作为${playerRole}的胜率
2. 当前倍数
3. 风险承受能力

请返回JSON格式: {"decision": "double/pass", "confidence": 0.7, "reasoning": "决策理由"}`
    } else if (phase === 'playing') {
      prompt += `请选择要出的牌。
可选牌型: 单牌、对子、三张、炸弹、顺子等
当前手牌: ${currentCards.join(', ')}

请返回JSON格式: {"decision": "要出的牌(如3,3或K)", "confidence": 0.9, "reasoning": "出牌理由"}`
    }

    return prompt
  }

  private async callGroqAPI(prompt: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的斗地主AI，擅长分析牌局和制定策略。请始终返回有效的JSON格式响应。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
        }),
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    } catch (error) {
      console.error('🤖 Groq API调用异常:', error)
      return null
    }
  }

  private parseResponse(response: string): AIDecisionResponse {
    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\{.*\}/s)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          decision: parsed.decision || 'pass',
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || '基于当前局面的判断',
        }
      }
    } catch (error) {
      console.error('🤖 AI响应解析失败:', error)
    }

    // 解析失败时的回退逻辑
    return {
      decision: 'pass',
      confidence: 0.3,
      reasoning: '解析AI响应失败，采用保守策略',
      fallback: 'parse_error'
    }
  }

  getRequestCount(): number {
    return this.requestCount
  }

  getRemainingRequests(): number {
    return Math.max(0, this.dailyLimit - this.requestCount)
  }

  resetDailyCount(): void {
    this.requestCount = 0
  }
}

// AI个性配置
export const AI_PERSONALITIES = {
  aggressive: {
    name: '激进型',
    description: '喜欢冒险，经常叫地主和加倍',
    bidProbability: 0.7,
    doubleProbability: 0.6,
    riskTolerance: 0.8,
  },
  conservative: {
    name: '保守型', 
    description: '谨慎稳重，只在有把握时才行动',
    bidProbability: 0.3,
    doubleProbability: 0.2,
    riskTolerance: 0.3,
  },
  balanced: {
    name: '平衡型',
    description: '综合考虑，策略均衡',
    bidProbability: 0.5,
    doubleProbability: 0.4,
    riskTolerance: 0.5,
  },
  unpredictable: {
    name: '不可预测',
    description: '行为难以预测，增加游戏趣味性',
    bidProbability: 0.6,
    doubleProbability: 0.5,
    riskTolerance: 0.7,
  },
}

// 全局AI服务实例
let groqAI: GroqAIService | null = null

export const getAIService = (): GroqAIService => {
  if (!groqAI) {
    groqAI = new GroqAIService()
  }
  return groqAI
}

// 便捷函数
export const makeAIDecision = async (context: AIDecisionContext): Promise<AIDecisionResponse | null> => {
  const aiService = getAIService()
  return await aiService.makeDecision(context)
}

export const setAIApiKey = (apiKey: string): void => {
  const aiService = getAIService()
  aiService.setApiKey(apiKey)
  console.log('🤖 AI API密钥已设置')
}

// 本地规则AI回退
export const getLocalAIDecision = (context: AIDecisionContext): AIDecisionResponse => {
  const { phase, personality } = context
  const personalityConfig = AI_PERSONALITIES[personality]
  
  if (phase === 'bidding') {
    const shouldBid = Math.random() < personalityConfig.bidProbability
    return {
      decision: shouldBid ? 'call' : 'pass',
      confidence: 0.6,
      reasoning: `基于${personalityConfig.name}特征的本地决策`
    }
  } else if (phase === 'multiplier') {
    const shouldDouble = Math.random() < personalityConfig.doubleProbability
    return {
      decision: shouldDouble ? 'double' : 'pass',
      confidence: 0.5,
      reasoning: `基于${personalityConfig.name}特征的本地决策`
    }
  }
  
  return {
    decision: 'pass',
    confidence: 0.4,
    reasoning: '本地规则AI决策'
  }
}
