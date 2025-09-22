class d{apiKey="";baseURL="https://api.groq.com/openai/v1";model="llama-3.1-8b-instant";fallbackModels=["mixtral-8x7b-32768","llama3-70b-8192","gemma-7b-it"];currentModelIndex=0;requestCount=0;dailyLimit=14e3;constructor(t){if(this.apiKey=t||"",typeof window<"u"){const e=new Date().toDateString(),o=localStorage.getItem("groq_api_usage");if(o)try{const s=JSON.parse(o);s.date===e?(this.requestCount=s.count||0,console.log(`📊 恢复今日API请求计数: ${this.requestCount}`)):(this.requestCount=0,this.saveDailyCount())}catch(s){console.error("恢复API请求计数失败:",s),this.requestCount=0}}}setApiKey(t){this.apiKey=t}async makeDecision(t){if(!this.apiKey)return console.log("🤖 AI API密钥未设置，使用本地规则AI"),null;if(this.requestCount>=this.dailyLimit)return console.log("🤖 AI API今日请求已达上限，使用本地规则AI"),null;try{const e=this.buildPrompt(t),o=await this.callGroqAPI(e);if(o)return this.parseResponse(o)}catch(e){console.error("🤖 AI API调用失败:",e)}return null}buildPrompt(t){const{phase:e,currentCards:o,playerId:s,playerRole:i,personality:r,difficulty:a}=t;let l=`你是一个专业的斗地主AI玩家。

【基本信息】
- AI个性: ${r} (aggressive=激进, conservative=保守, balanced=平衡, unpredictable=不可预测)
- 难度等级: ${a}
- 当前角色: ${i||"未确定"}
- 当前手牌: ${o.join(", ")}

【斗地主规则】
- 牌型：单牌、对子、三张、三带一、三带二、顺子(连牌)、连对、飞机、炸弹、王炸
- 大小顺序：3<4<5<6<7<8<9<10<J<Q<K<A<2<小王<大王
- 花色无关，只看点数大小
- 地主拿3张底牌，需要先出牌

当前游戏阶段: ${e}

`;return e==="bidding"?l+=`请决定是否叫地主。选项: "call"(叫地主), "pass"(不叫), "grab"(抢地主)

【分析要点】
1. 牌力分析：统计大牌(A/2/王)、炸弹、三张、对子数量
2. 牌型组合：是否有顺子、连对、飞机等强牌型
3. 控制力：能否压制其他玩家的出牌
4. 个性匹配：根据AI个性调整风险偏好

请返回JSON格式: {"decision": "call/pass/grab", "confidence": 0.8, "reasoning": "基于斗地主规则的专业分析"}`:e==="multiplier"?l+=`请决定是否加倍。选项: "double"(加倍), "pass"(不加倍)
考虑因素:
1. 作为${i}的胜率
2. 当前倍数
3. 风险承受能力

请返回JSON格式: {"decision": "double/pass", "confidence": 0.7, "reasoning": "决策理由"}`:e==="playing"&&(l+=`请选择要出的牌。

【出牌分析要点】
1. 牌型识别：分析可出的牌型(单牌、对子、三张、顺子、连对、飞机、炸弹等)
2. 大小判断：确保能压过上家，或选择pass
3. 手牌优化：保留好的牌型组合，优先出散牌
4. 战术考虑：地主先手权，农民配合

当前可用手牌: ${o.join(", ")}

请返回JSON格式: {"decision": "要出的牌(如3,3或K)或pass", "confidence": 0.9, "reasoning": "基于斗地主战术的出牌分析"}`),l}async callGroqAPI(t){const e=[this.model,...this.fallbackModels];for(let o=0;o<e.length;o++){const s=e[o];try{console.log(`🤖 正在调用Groq API... (尝试模型 ${o+1}/${e.length})`),console.log("  - 模型:",s),console.log("  - API密钥:",this.apiKey?`${this.apiKey.substring(0,10)}...`:"未设置");const i=await fetch(`${this.baseURL}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:s,messages:[{role:"system",content:"你是一个专业的斗地主AI专家，精通斗地主规则、牌型分析和游戏策略。请用专业的斗地主术语分析，避免使用扑克牌概念（如花色、同花等）。始终返回有效的JSON格式响应。"},{role:"user",content:t}],max_tokens:500,temperature:.7,top_p:.9})});if(console.log("🤖 Groq API响应状态:",i.status),!i.ok){const a=await i.text();if(console.error(`🤖 模型 ${s} 错误:`,a),i.status===400&&o<e.length-1){console.log("🔄 尝试下一个模型...");continue}throw new Error(`Groq API error: ${i.status} - ${a}`)}const r=await i.json();return console.log(`🤖 模型 ${s} 响应成功:`,r.choices?.[0]?.message?.content),this.requestCount++,this.saveDailyCount(),console.log(`📊 API请求计数: ${this.requestCount}/${this.dailyLimit}`),s!==this.model&&(console.log(`🔄 切换主模型从 ${this.model} 到 ${s}`),this.model=s),r.choices?.[0]?.message?.content||null}catch(i){if(console.error(`🤖 模型 ${s} 调用异常:`,i),o<e.length-1){console.log("🔄 尝试下一个模型...");continue}return console.error("🤖 所有模型都调用失败"),null}}return null}parseResponse(t){try{const e=t.match(/\{.*\}/s);if(e){const o=JSON.parse(e[0]);return{decision:o.decision||"pass",confidence:o.confidence||.5,reasoning:o.reasoning||"基于当前局面的判断"}}}catch(e){console.error("🤖 AI响应解析失败:",e)}return{decision:"pass",confidence:.3,reasoning:"解析AI响应失败，采用保守策略",fallback:"parse_error"}}getRequestCount(){return this.requestCount}getRemainingRequests(){return Math.max(0,this.dailyLimit-this.requestCount)}async getUsageFromAPI(){return this.apiKey?(console.log("📊 Groq API暂不支持使用统计端点，使用本地计数"),{used:this.requestCount,limit:this.dailyLimit}):(console.log("🔑 API密钥未设置，无法获取使用统计"),null)}resetDailyCount(){this.requestCount=0,this.saveDailyCount()}saveDailyCount(){if(typeof window<"u"){const e={date:new Date().toDateString(),count:this.requestCount};localStorage.setItem("groq_api_usage",JSON.stringify(e))}}}const p={aggressive:{name:"激进型",description:"喜欢冒险，经常叫地主和加倍",bidProbability:.7,doubleProbability:.6,riskTolerance:.8},conservative:{name:"保守型",description:"谨慎稳重，只在有把握时才行动",bidProbability:.3,doubleProbability:.2,riskTolerance:.3},balanced:{name:"平衡型",description:"综合考虑，策略均衡",bidProbability:.5,doubleProbability:.4,riskTolerance:.5},unpredictable:{name:"不可预测",description:"行为难以预测，增加游戏趣味性",bidProbability:.6,doubleProbability:.5,riskTolerance:.7}};let c=null;const u=()=>(c||(c=new d),c),g=async n=>await u().makeDecision(n),h=n=>{u().setApiKey(n),console.log("🤖 AI API密钥已设置")},y=async()=>await u().getUsageFromAPI(),b=n=>{const{phase:t,personality:e}=n,o=p[e];return t==="bidding"?{decision:Math.random()<o.bidProbability?"call":"pass",confidence:.6,reasoning:`基于${o.name}特征的本地决策`}:t==="multiplier"?{decision:Math.random()<o.doubleProbability?"double":"pass",confidence:.5,reasoning:`基于${o.name}特征的本地决策`}:{decision:"pass",confidence:.4,reasoning:"本地规则AI决策"}};export{p as AI_PERSONALITIES,u as getAIService,y as getAPIUsage,b as getLocalAIDecision,g as makeAIDecision,h as setAIApiKey};
