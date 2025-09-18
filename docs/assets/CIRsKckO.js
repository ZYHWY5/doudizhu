class u{apiKey="";baseURL="https://api.groq.com/openai/v1";model="llama2-70b-4096";requestCount=0;dailyLimit=14e3;constructor(i){this.apiKey=i||""}setApiKey(i){this.apiKey=i}async makeDecision(i){if(!this.apiKey)return console.log("🤖 AI API密钥未设置，使用本地规则AI"),null;if(this.requestCount>=this.dailyLimit)return console.log("🤖 AI API今日请求已达上限，使用本地规则AI"),null;try{const e=this.buildPrompt(i),o=await this.callGroqAPI(e);if(o)return this.requestCount++,this.parseResponse(o)}catch(e){console.error("🤖 AI API调用失败:",e)}return null}buildPrompt(i){const{phase:e,currentCards:o,playerId:t,playerRole:a,personality:l,difficulty:d}=i;let s=`你是一个斗地主游戏的AI玩家，具有以下特征：
- 个性: ${l} (aggressive=激进, conservative=保守, balanced=平衡, unpredictable=不可预测)
- 难度: ${d}
- 角色: ${a||"未确定"}
- 当前手牌: ${o.join(", ")}

当前游戏阶段: ${e}

`;return e==="bidding"?s+=`请决定是否叫地主。选项: "call"(叫地主), "pass"(不叫), "grab"(抢地主)
考虑因素:
1. 手牌强度
2. 个性特征
3. 风险偏好

请返回JSON格式: {"decision": "call/pass/grab", "confidence": 0.8, "reasoning": "决策理由"}`:e==="multiplier"?s+=`请决定是否加倍。选项: "double"(加倍), "pass"(不加倍)
考虑因素:
1. 作为${a}的胜率
2. 当前倍数
3. 风险承受能力

请返回JSON格式: {"decision": "double/pass", "confidence": 0.7, "reasoning": "决策理由"}`:e==="playing"&&(s+=`请选择要出的牌。
可选牌型: 单牌、对子、三张、炸弹、顺子等
当前手牌: ${o.join(", ")}

请返回JSON格式: {"decision": "要出的牌(如3,3或K)", "confidence": 0.9, "reasoning": "出牌理由"}`),s}async callGroqAPI(i){try{const e=await fetch(`${this.baseURL}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:this.model,messages:[{role:"system",content:"你是一个专业的斗地主AI，擅长分析牌局和制定策略。请始终返回有效的JSON格式响应。"},{role:"user",content:i}],max_tokens:500,temperature:.7,top_p:.9})});if(!e.ok)throw new Error(`Groq API error: ${e.status}`);return(await e.json()).choices?.[0]?.message?.content||null}catch(e){return console.error("🤖 Groq API调用异常:",e),null}}parseResponse(i){try{const e=i.match(/\{.*\}/s);if(e){const o=JSON.parse(e[0]);return{decision:o.decision||"pass",confidence:o.confidence||.5,reasoning:o.reasoning||"基于当前局面的判断"}}}catch(e){console.error("🤖 AI响应解析失败:",e)}return{decision:"pass",confidence:.3,reasoning:"解析AI响应失败，采用保守策略",fallback:"parse_error"}}getRequestCount(){return this.requestCount}getRemainingRequests(){return Math.max(0,this.dailyLimit-this.requestCount)}resetDailyCount(){this.requestCount=0}}const p={aggressive:{name:"激进型",description:"喜欢冒险，经常叫地主和加倍",bidProbability:.7,doubleProbability:.6,riskTolerance:.8},conservative:{name:"保守型",description:"谨慎稳重，只在有把握时才行动",bidProbability:.3,doubleProbability:.2,riskTolerance:.3},balanced:{name:"平衡型",description:"综合考虑，策略均衡",bidProbability:.5,doubleProbability:.4,riskTolerance:.5},unpredictable:{name:"不可预测",description:"行为难以预测，增加游戏趣味性",bidProbability:.6,doubleProbability:.5,riskTolerance:.7}};let r=null;const c=()=>(r||(r=new u),r),b=async n=>await c().makeDecision(n),y=n=>{c().setApiKey(n),console.log("🤖 AI API密钥已设置")},h=n=>{const{phase:i,personality:e}=n,o=p[e];return i==="bidding"?{decision:Math.random()<o.bidProbability?"call":"pass",confidence:.6,reasoning:`基于${o.name}特征的本地决策`}:i==="multiplier"?{decision:Math.random()<o.doubleProbability?"double":"pass",confidence:.5,reasoning:`基于${o.name}特征的本地决策`}:{decision:"pass",confidence:.4,reasoning:"本地规则AI决策"}};export{p as AI_PERSONALITIES,c as getAIService,h as getLocalAIDecision,b as makeAIDecision,y as setAIApiKey};
