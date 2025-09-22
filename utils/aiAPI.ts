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
  private model = 'llama-3.1-8b-instant' // 使用Groq当前支持的模型
  private fallbackModels = ['mixtral-8x7b-32768', 'llama3-70b-8192', 'gemma-7b-it'] // 备选模型
  private currentModelIndex = 0
  private requestCount = 0
  private dailyLimit = 14000 // 保留一些余量

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ''
    
    // 🔢 从localStorage恢复请求计数
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString()
      const savedData = localStorage.getItem('groq_api_usage')
      
      if (savedData) {
        try {
          const data = JSON.parse(savedData)
          if (data.date === today) {
            this.requestCount = data.count || 0
            console.log(`📊 恢复今日API请求计数: ${this.requestCount}`)
          } else {
            // 新的一天，重置计数
            this.requestCount = 0
            this.saveDailyCount()
          }
        } catch (error) {
          console.error('恢复API请求计数失败:', error)
          this.requestCount = 0
        }
      }
    }
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
        return this.parseResponse(response)
      }
    } catch (error) {
      console.error('🤖 AI API调用失败:', error)
    }

    return null
  }

  private buildPrompt(context: AIDecisionContext): string {
    const { phase, currentCards, playerId, playerRole, personality, difficulty } = context

    let prompt = `你是一个专业的斗地主AI玩家。

【基本信息】
- AI个性: ${personality} (aggressive=激进, conservative=保守, balanced=平衡, unpredictable=不可预测)
- 难度等级: ${difficulty}
- 当前角色: ${playerRole || '未确定'}
- 当前手牌: ${currentCards.join(', ')}

【斗地主规则】
- 牌型：单牌、对子、三张、三带一、三带二、顺子(连牌)、连对、飞机、炸弹、王炸
- 大小顺序：3<4<5<6<7<8<9<10<J<Q<K<A<2<小王<大王
- 花色无关，只看点数大小
- 地主拿3张底牌，需要先出牌

当前游戏阶段: ${phase}

`

    if (phase === 'bidding') {
      // 检查是否已经有人叫地主
      const hasCall = context.biddingHistory.some(bid => bid.bid === 'call')
      
      if (!hasCall) {
        // 叫地主阶段
        prompt += `【叫地主阶段】请决定是否叫地主。选项: "call"(叫地主), "pass"(不叫)

【分析要点】
1. 牌力分析：统计大牌(A/2/王)、炸弹、三张、对子数量
2. 牌型组合：是否有顺子、连对、飞机等强牌型
3. 控制力：能否压制其他玩家的出牌
4. 个性匹配：根据AI个性调整风险偏好

请返回JSON格式: {"decision": "call/pass", "confidence": 0.8, "reasoning": "基于斗地主规则的专业分析"}`
      } else {
        // 抢地主阶段
        prompt += `【抢地主阶段】已经有人叫地主，请决定是否抢地主。选项: "grab"(抢地主), "pass"(不抢)

【分析要点】
1. 牌力分析：你的牌力是否足够强过叫地主的玩家
2. 牌型组合：是否有足够的控制牌和强牌型
3. 风险评估：抢地主需要承担更大责任
4. 个性匹配：根据AI个性调整抢地主的积极性

请返回JSON格式: {"decision": "grab/pass", "confidence": 0.8, "reasoning": "基于斗地主规则的专业分析"}`
      }
    } else if (phase === 'multiplier') {
      prompt += `请决定是否加倍。选项: "double"(加倍), "pass"(不加倍)
考虑因素:
1. 作为${playerRole}的胜率
2. 当前倍数
3. 风险承受能力

请返回JSON格式: {"decision": "double/pass", "confidence": 0.7, "reasoning": "决策理由"}`
    } else if (phase === 'playing') {
      prompt += `请选择要出的牌。

【出牌分析要点】
1. 牌型识别：分析可出的牌型(单牌、对子、三张、顺子、连对、飞机、炸弹等)
2. 大小判断：确保能压过上家，或选择pass
3. 手牌优化：保留好的牌型组合，优先出散牌
4. 战术考虑：地主先手权，农民配合

当前可用手牌: ${currentCards.join(', ')}

请返回JSON格式: {"decision": "要出的牌(如3,3或K)或pass", "confidence": 0.9, "reasoning": "基于斗地主战术的出牌分析"}`
    }

    return prompt
  }

  private async callGroqAPI(prompt: string): Promise<string | null> {
    const modelsToTry = [this.model, ...this.fallbackModels]
    
    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i]
      
      try {
        console.log(`🤖 正在调用Groq API... (尝试模型 ${i + 1}/${modelsToTry.length})`)
        console.log('  - 模型:', currentModel)
        console.log('  - API密钥:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : '未设置')
        
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [
            {
              role: 'system',
              content: '你是一个专业的斗地主AI专家，精通斗地主规则、牌型分析和游戏策略。请用专业的斗地主术语分析，避免使用扑克牌概念（如花色、同花等）。始终返回有效的JSON格式响应。'
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

        console.log('🤖 Groq API响应状态:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`🤖 模型 ${currentModel} 错误:`, errorText)
          
          // 如果是模型相关错误且还有其他模型可以尝试，继续下一个模型
          if (response.status === 400 && i < modelsToTry.length - 1) {
            console.log(`🔄 尝试下一个模型...`)
            continue
          }
          
          throw new Error(`Groq API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log(`🤖 模型 ${currentModel} 响应成功:`, data.choices?.[0]?.message?.content)
        
        // 🔢 成功调用时增加请求计数
        this.requestCount++
        this.saveDailyCount() // 保存到localStorage
        console.log(`📊 API请求计数: ${this.requestCount}/${this.dailyLimit}`)
        
        // 成功时更新主模型为当前工作的模型
        if (currentModel !== this.model) {
          console.log(`🔄 切换主模型从 ${this.model} 到 ${currentModel}`)
          this.model = currentModel
        }
        
        return data.choices?.[0]?.message?.content || null
        
      } catch (error) {
        console.error(`🤖 模型 ${currentModel} 调用异常:`, error)
        
        // 如果还有其他模型可以尝试，继续
        if (i < modelsToTry.length - 1) {
          console.log(`🔄 尝试下一个模型...`)
          continue
        }
        
        // 所有模型都失败了
        console.error('🤖 所有模型都调用失败')
        return null
      }
    }
    
    return null
  }

  private parseResponse(response: string): AIDecisionResponse {
    try {
      console.log('🤖 原始AI响应:', response)
      
      // 尝试多种方式提取JSON
      let jsonStr = ''
      
      // 方式1: 寻找完整的JSON对象
      const jsonMatch = response.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/s)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      } else {
        // 方式2: 寻找```json代码块
        const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim()
        } else {
          // 方式3: 寻找任何包含decision的JSON片段
          const decisionMatch = response.match(/"decision"\s*:\s*"([^"]+)"/i)
          if (decisionMatch) {
            const decision = decisionMatch[1]
            const confidenceMatch = response.match(/"confidence"\s*:\s*([0-9.]+)/i)
            const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5
            
            return {
              decision,
              confidence,
              reasoning: '从AI响应中提取的决策',
            }
          }
        }
      }
      
      if (jsonStr) {
        // 清理可能的格式问题
        jsonStr = jsonStr
          .replace(/,\s*}/g, '}')  // 移除末尾多余的逗号
          .replace(/,\s*]/g, ']')  // 移除数组末尾多余的逗号
          .replace(/\/\/[^\r\n]*$/gm, '')  // 移除单行注释
          .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
          .replace(/\n/g, ' ')     // 移除换行符
          .replace(/\s+/g, ' ')    // 压缩多个空格为一个
          .trim()
        
        console.log('🤖 提取的JSON:', jsonStr)
        const parsed = JSON.parse(jsonStr)
        
        return {
          decision: parsed.decision || 'pass',
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || '基于当前局面的判断',
        }
      }
    } catch (error) {
      console.error('🤖 AI响应解析失败:', error)
      console.error('🤖 原始响应:', response)
    }

    // 解析失败时的回退逻辑
    console.warn('🤖 使用回退决策: pass')
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

  // 尝试从Groq API获取使用统计（如果支持的话）
  async getUsageFromAPI(): Promise<{ used: number; limit: number } | null> {
    if (!this.apiKey) {
      console.log('🔑 API密钥未设置，无法获取使用统计')
      return null
    }

    // Groq API目前可能不支持使用统计端点，直接返回本地计数
    console.log('📊 Groq API暂不支持使用统计端点，使用本地计数')
    return {
      used: this.requestCount,
      limit: this.dailyLimit
    }

    /* 保留代码以备将来Groq支持使用统计端点
    try {
      console.log('📊 正在从Groq API获取使用统计...')
      
      // 尝试不同的可能端点
      const endpoints = ['/usage', '/billing/usage', '/account/usage']
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            }
          })

          if (response.ok) {
            const data = await response.json()
            console.log('📊 Groq API使用统计:', data)
            
            // 根据Groq API响应结构调整
            if (data.usage) {
              const used = data.usage.total_tokens || data.usage.requests || 0
              const limit = data.limits?.requests_per_day || this.dailyLimit
              
              // 更新本地计数
              this.requestCount = used
              this.saveDailyCount()
              
              return { used, limit }
            }
          }
        } catch (error) {
          // 尝试下一个端点
          continue
        }
      }
      
      return null
    } catch (error) {
      console.error('📊 获取Groq API使用统计异常:', error)
      return null
    }
    */
  }

  resetDailyCount(): void {
    this.requestCount = 0
    this.saveDailyCount()
  }

  private saveDailyCount(): void {
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString()
      const data = {
        date: today,
        count: this.requestCount
      }
      localStorage.setItem('groq_api_usage', JSON.stringify(data))
    }
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

// 从Groq API获取真实使用统计
export const getAPIUsage = async (): Promise<{ used: number; limit: number } | null> => {
  const aiService = getAIService()
  return await aiService.getUsageFromAPI()
}

// 本地规则AI回退
export const getLocalAIDecision = (context: AIDecisionContext): AIDecisionResponse => {
  const { phase, personality, biddingHistory } = context
  const personalityConfig = AI_PERSONALITIES[personality]
  
  console.log('🤖 本地AI决策 - 阶段:', phase, '个性:', personality, '叫地主历史:', biddingHistory)
  
  if (phase === 'bidding') {
    // 检查是否有人已经叫地主
    const hasCall = biddingHistory.some(bid => bid.bid === 'call')
    
    if (!hasCall) {
      // 叫地主阶段
      const shouldBid = Math.random() < personalityConfig.bidProbability
      const decision = shouldBid ? 'call' : 'pass'
      console.log('🤖 叫地主阶段决策:', decision)
      return {
        decision,
        confidence: 0.6,
        reasoning: `基于${personalityConfig.name}特征的叫地主决策`
      }
    } else {
      // 抢地主阶段
      const shouldGrab = Math.random() < personalityConfig.bidProbability * 0.7 // 抢地主概率稍低
      const decision = shouldGrab ? 'grab' : 'pass'
      console.log('🤖 抢地主阶段决策:', decision)
      return {
        decision,
        confidence: 0.5,
        reasoning: `基于${personalityConfig.name}特征的抢地主决策`
      }
    }
  } else if (phase === 'multiplier') {
    const shouldDouble = Math.random() < personalityConfig.doubleProbability
    return {
      decision: shouldDouble ? 'double' : 'pass',
      confidence: 0.5,
      reasoning: `基于${personalityConfig.name}特征的倍数决策`
    }
  }
  
  return {
    decision: 'pass',
    confidence: 0.4,
    reasoning: '本地规则AI默认决策'
  }
}
