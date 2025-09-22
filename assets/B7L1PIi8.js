class g{apiKey="";baseURL="https://api.groq.com/openai/v1";model="llama-3.1-8b-instant";fallbackModels=["mixtral-8x7b-32768","llama3-70b-8192","gemma-7b-it"];currentModelIndex=0;requestCount=0;dailyLimit=14e3;constructor(s){if(this.apiKey=s||"",typeof window<"u"){const e=new Date().toDateString(),t=localStorage.getItem("groq_api_usage");if(t)try{const o=JSON.parse(t);o.date===e?(this.requestCount=o.count||0,console.log(`📊 恢复今日API请求计数: ${this.requestCount}`)):(this.requestCount=0,this.saveDailyCount())}catch(o){console.error("恢复API请求计数失败:",o),this.requestCount=0}}}setApiKey(s){this.apiKey=s}async makeDecision(s){if(!this.apiKey)return console.log("🤖 AI API密钥未设置，使用本地规则AI"),null;if(this.requestCount>=this.dailyLimit)return console.log("🤖 AI API今日请求已达上限，使用本地规则AI"),null;try{const e=this.buildPrompt(s),t=await this.callGroqAPI(e);if(t)return this.parseResponse(t)}catch(e){console.error("🤖 AI API调用失败:",e)}return null}buildPrompt(s){const{phase:e,currentCards:t,playerId:o,playerRole:i,personality:r,difficulty:n}=s;let l=`你是一个专业的斗地主AI玩家。

【基本信息】
- AI个性: ${r} (aggressive=激进, conservative=保守, balanced=平衡, unpredictable=不可预测)
- 难度等级: ${n}
- 当前角色: ${i||"未确定"}
- 当前手牌: ${t.join(", ")}

【斗地主规则】
- 牌型：单牌、对子、三张、三带一、三带二、顺子(连牌)、连对、飞机、炸弹、王炸
- 大小顺序：3<4<5<6<7<8<9<10<J<Q<K<A<2<小王<大王
- 花色无关，只看点数大小
- 地主拿3张底牌，需要先出牌

当前游戏阶段: ${e}

`;return e==="bidding"?s.biddingHistory.some(u=>u.bid==="call")?l+=`【抢地主阶段】已经有人叫地主，请决定是否抢地主。选项: "grab"(抢地主), "pass"(不抢)

【分析要点】
1. 牌力分析：你的牌力是否足够强过叫地主的玩家
2. 牌型组合：是否有足够的控制牌和强牌型
3. 风险评估：抢地主需要承担更大责任
4. 个性匹配：根据AI个性调整抢地主的积极性

请返回JSON格式: {"decision": "grab/pass", "confidence": 0.8, "reasoning": "基于斗地主规则的专业分析"}`:l+=`【叫地主阶段】请决定是否叫地主。选项: "call"(叫地主), "pass"(不叫)

【分析要点】
1. 牌力分析：统计大牌(A/2/王)、炸弹、三张、对子数量
2. 牌型组合：是否有顺子、连对、飞机等强牌型
3. 控制力：能否压制其他玩家的出牌
4. 个性匹配：根据AI个性调整风险偏好

请返回JSON格式: {"decision": "call/pass", "confidence": 0.8, "reasoning": "基于斗地主规则的专业分析"}`:e==="multiplier"?l+=`请决定是否加倍。选项: "double"(加倍), "pass"(不加倍)
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

当前可用手牌: ${t.join(", ")}

请返回JSON格式: {"decision": "要出的牌(如3,3或K)或pass", "confidence": 0.9, "reasoning": "基于斗地主战术的出牌分析"}`),l}async callGroqAPI(s){const e=[this.model,...this.fallbackModels];for(let t=0;t<e.length;t++){const o=e[t];try{console.log(`🤖 正在调用Groq API... (尝试模型 ${t+1}/${e.length})`),console.log("  - 模型:",o),console.log("  - API密钥:",this.apiKey?`${this.apiKey.substring(0,10)}...`:"未设置");const i=await fetch(`${this.baseURL}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:o,messages:[{role:"system",content:"你是一个专业的斗地主AI专家，精通斗地主规则、牌型分析和游戏策略。请用专业的斗地主术语分析，避免使用扑克牌概念（如花色、同花等）。始终返回有效的JSON格式响应。"},{role:"user",content:s}],max_tokens:500,temperature:.7,top_p:.9})});if(console.log("🤖 Groq API响应状态:",i.status),!i.ok){const n=await i.text();if(console.error(`🤖 模型 ${o} 错误:`,n),i.status===400&&t<e.length-1){console.log("🔄 尝试下一个模型...");continue}throw new Error(`Groq API error: ${i.status} - ${n}`)}const r=await i.json();return console.log(`🤖 模型 ${o} 响应成功:`,r.choices?.[0]?.message?.content),this.requestCount++,this.saveDailyCount(),console.log(`📊 API请求计数: ${this.requestCount}/${this.dailyLimit}`),o!==this.model&&(console.log(`🔄 切换主模型从 ${this.model} 到 ${o}`),this.model=o),r.choices?.[0]?.message?.content||null}catch(i){if(console.error(`🤖 模型 ${o} 调用异常:`,i),t<e.length-1){console.log("🔄 尝试下一个模型...");continue}return console.error("🤖 所有模型都调用失败"),null}}return null}parseResponse(s){try{console.log("🤖 原始AI响应:",s);let e="";const t=s.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/s);if(t)e=t[0];else{const o=s.match(/```json\s*([\s\S]*?)\s*```/);if(o)e=o[1].trim();else{const i=s.match(/"decision"\s*:\s*"([^"]+)"/i);if(i){const r=i[1],n=s.match(/"confidence"\s*:\s*([0-9.]+)/i),l=n?parseFloat(n[1]):.5;return{decision:r,confidence:l,reasoning:"从AI响应中提取的决策"}}}}if(e){e=e.replace(/,\s*}/g,"}").replace(/,\s*]/g,"]").replace(/\/\/[^\r\n]*$/gm,"").replace(/\/\*[\s\S]*?\*\//g,"").replace(/\n/g," ").replace(/\s+/g," ").trim(),console.log("🤖 提取的JSON:",e);const o=JSON.parse(e);return{decision:o.decision||"pass",confidence:o.confidence||.5,reasoning:o.reasoning||"基于当前局面的判断"}}}catch(e){console.error("🤖 AI响应解析失败:",e),console.error("🤖 原始响应:",s)}return console.warn("🤖 使用回退决策: pass"),{decision:"pass",confidence:.3,reasoning:"解析AI响应失败，采用保守策略",fallback:"parse_error"}}getRequestCount(){return this.requestCount}getRemainingRequests(){return Math.max(0,this.dailyLimit-this.requestCount)}async getUsageFromAPI(){return this.apiKey?(console.log("📊 Groq API暂不支持使用统计端点，使用本地计数"),{used:this.requestCount,limit:this.dailyLimit}):(console.log("🔑 API密钥未设置，无法获取使用统计"),null)}resetDailyCount(){this.requestCount=0,this.saveDailyCount()}saveDailyCount(){if(typeof window<"u"){const e={date:new Date().toDateString(),count:this.requestCount};localStorage.setItem("groq_api_usage",JSON.stringify(e))}}}const h={aggressive:{name:"激进型",description:"喜欢冒险，经常叫地主和加倍",bidProbability:.7,doubleProbability:.6,riskTolerance:.8},conservative:{name:"保守型",description:"谨慎稳重，只在有把握时才行动",bidProbability:.3,doubleProbability:.2,riskTolerance:.3},balanced:{name:"平衡型",description:"综合考虑，策略均衡",bidProbability:.5,doubleProbability:.4,riskTolerance:.5},unpredictable:{name:"不可预测",description:"行为难以预测，增加游戏趣味性",bidProbability:.6,doubleProbability:.5,riskTolerance:.7}};let c=null;const d=()=>(c||(c=new g),c),b=async a=>await d().makeDecision(a),m=a=>{d().setApiKey(a),console.log("🤖 AI API密钥已设置")},y=async()=>await d().getUsageFromAPI(),f=a=>{const{phase:s,personality:e,biddingHistory:t}=a,o=h[e];if(console.log("🤖 本地AI决策 - 阶段:",s,"个性:",e,"叫地主历史:",t),s==="bidding")if(t.some(r=>r.bid==="call")){const n=Math.random()<o.bidProbability*.7?"grab":"pass";return console.log("🤖 抢地主阶段决策:",n),{decision:n,confidence:.5,reasoning:`基于${o.name}特征的抢地主决策`}}else{const n=Math.random()<o.bidProbability?"call":"pass";return console.log("🤖 叫地主阶段决策:",n),{decision:n,confidence:.6,reasoning:`基于${o.name}特征的叫地主决策`}}else if(s==="multiplier")return{decision:Math.random()<o.doubleProbability?"double":"pass",confidence:.5,reasoning:`基于${o.name}特征的倍数决策`};return{decision:"pass",confidence:.4,reasoning:"本地规则AI默认决策"}};export{h as AI_PERSONALITIES,d as getAIService,y as getAPIUsage,f as getLocalAIDecision,b as makeAIDecision,m as setAIApiKey};
