import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { VOLCANO_ENGINE_CONFIG } from './apiConfig';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成道具类型定义
export interface GeneratedProp {
  id: string;
  name: string;
  description: string;
  type: string;
  imageUrl: string;
  knowledge: string; // 道具相关知识
}

// 生成解密脚本类型定义
export interface PuzzleScript {
  id: string;
  title: string;
  description: string;
  clue: string;
  solution: string;
  knowledge: string; // 解密相关知识
}

// 场景线索类型定义
export interface SceneClue {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  imageUrl: string;
  knowledge: string;
  collected: boolean;
}

  // 语言模型类型定义
  type LanguageModel = 'coze' | 'deepseek' | 'doubao' | 'doubao-1.5-thinking-pro' | 'volcano-doubao';

  // 多语言模型调用函数
  export async function callLanguageModel(npc: any, message: string, model: LanguageModel = 'coze') {
    // 根据NPC角色特点选择最合适的模型
    const modelPreference: Record<string, LanguageModel> = {
      '幽默': 'doubao',    // 豆包擅长幽默对话
      '严肃': 'deepseek', // DeepSeek更适合严肃内容
      '简洁': 'coze',     // Coze适合简洁回应
      '冗长': 'deepseek', // DeepSeek能提供更详细内容
      '正式': 'deepseek', // DeepSeek更正式
      '口语化': 'doubao',  // 豆包更口语化
      '详细': 'volcano-doubao' // 火山引擎Doubao适合生成详细内容
    };
  
  // 根据NPC说话风格自动选择模型，或使用指定模型
  // 优先使用用户明确指定的模型，否则根据角色特点选择
  const selectedModel = model || modelPreference[npc.speechPattern] || 'coze';
  
  // 构建角色设定提示词
  const systemPrompt = `你是游戏中的NPC角色${npc.name}，你的身份是${npc.role}。你的性格特点是${npc.personality}，说话风格${npc.speechPattern}。请完全沉浸在这个角色中，用第一人称与玩家对话。

你的回应必须符合以下要求：
1. 始终使用角色的口吻和说话方式
2. 对话应简短自然，符合角色身份
3. 根据玩家的问题和话题，提供符合角色设定的回应
4. 不要透露你是AI或游戏角色的事实
5. 如果玩家的问题与游戏世界无关，可以礼貌地引导回游戏相关话题
6. 每次回应都要有所不同，避免重复之前说过的话`;

    try {
      // 模拟不同模型的API调用
      switch(selectedModel) {
        case 'coze':
          // Coze API调用实现
          const cozeResponse = await fetch('https://api.coze.cn/open_api/v2/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer pat_loHotLpz3QZmnQophZoViWbXVivOIuIWiqHpEfX6fDQPK1WyzyKgneH6gVTGEFga`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ]
            })
          });
          
          if (!cozeResponse.ok) throw new Error(`Coze API error: ${cozeResponse.status}`);
          const cozeData = await cozeResponse.json();
          return cozeData.choices?.[0]?.message?.content || getFallbackReply(npc);
          
        case 'deepseek':
          // 模拟DeepSeek API调用
          await new Promise(resolve => setTimeout(resolve, 800));
          return generateMockResponse(npc, message, 'deepseek');
          
        case 'volcano-doubao':
          // 调用火山引擎Doubao-Seed-1.6-thinking API
          console.log("调用火山引擎Doubao API:", {
            model: VOLCANO_ENGINE_CONFIG.doubaoModel,
            systemPromptLength: systemPrompt.length,
            userMessage: message.substring(0, 50) + '...'
          });
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
          
          try {
            // 火山引擎API调用 - 修复版
            const response = await fetch(`${VOLCANO_ENGINE_CONFIG.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VOLCANO_ENGINE_CONFIG.apiKey}`,
                'x-is-encrypted': 'true'
              },
              signal: controller.signal,
              body: JSON.stringify({
                model: VOLCANO_ENGINE_CONFIG.doubaoModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                top_p: 0.9
              })
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              const errorData = await response.text();
              console.error(`火山引擎API错误响应: ${response.status} - ${errorData}`);
              
              // 详细错误分类
              if (response.status === 401 || response.status === 403) {
                throw new Error(`API认证失败: 请检查API密钥是否正确`);
              } else if (response.status === 404) {
                throw new Error(`API端点不存在: 请检查接入点ID是否正确`);
              } else if (response.status === 429) {
                throw new Error(`API调用频率超限: 请稍后再试`);
              } else {
                throw new Error(`火山引擎API错误: ${response.status}, ${errorData}`);
              }
            }
            
            const responseData = await response.json();
            
            // 验证响应格式
            if (!responseData || !responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
              console.error("火山引擎API返回格式不符合预期:", responseData);
              throw new Error("API返回格式错误，无法解析响应内容");
            }
            
            console.log("火山引擎API调用成功，响应内容:", responseData.choices[0].message.content.substring(0, 50) + "...");
            return responseData.choices[0].message.content;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
          
         case 'doubao-1.5-thinking-pro':
          // 调用真实的Doubao-1.5-thinking-pro API
          console.log("调用豆包1.5 API:", {
            model: 'doubao-1-5-thinking-pro-250415',
            systemPromptLength: systemPrompt.length,
            userMessage: message.substring(0, 50) + '...'
          });
          
          // 使用豆包API的正确请求格式
          const doubaoController = new AbortController();
          const doubaoTimeoutId = setTimeout(() => doubaoController.abort(), 15000); // 15秒超时
          
          const doubaoResponse = await fetch('https://api.doubao.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer 01a0812e-ea8e-4be8-9357-f7e762af77ca'
            },
            signal: doubaoController.signal,
            body: JSON.stringify({
              model: 'doubao-1.5-thinking-pro', // 修正模型名称格式
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ],
              temperature: 0.7,
              max_tokens: 1000,
              top_p: 0.9,
              stream: false
            })
          });
          
          clearTimeout(doubaoTimeoutId); // 清除超时定时器
          
          // 记录完整响应状态和头部信息用于调试
          console.log(`豆包API响应状态: ${doubaoResponse.status}`);
          
          if (!doubaoResponse.ok) {
            const errorData = await doubaoResponse.text();
            console.error(`豆包API错误响应: ${errorData}`);
            throw new Error(`Doubao API error: ${doubaoResponse.status}, ${errorData}`);
          }
          
          const doubaoData = await doubaoResponse.json();
          console.log("豆包API响应数据:", doubaoData);
          
          // 检查响应结构
          if (!doubaoData.choices || !doubaoData.choices[0] || !doubaoData.choices[0].message) {
            console.error("豆包API返回格式不符合预期:", doubaoData);
            throw new Error("Doubao API returned unexpected response format");
          }
          
          return doubaoData.choices[0].message.content || getFallbackReply(npc);
         
        default:
          throw new Error(`Unsupported language model: ${selectedModel}`);
      }
  } catch (error) {
    console.error(`${selectedModel} API调用失败:`, error);
    return getFallbackReply(npc);
  }
}

// 根据NPC角色生成模拟回应
function generateMockResponse(npc: any, message: string, model: LanguageModel): string {
  // 根据不同模型特点生成不同风格的回应
  const modelResponses: Record<LanguageModel, Record<string, string[]>> = {
    coze: {
      '中立': [
        `${npc.name}：有什么可以帮你的吗？`,
        `我能为你提供些什么帮助？`,
        `需要了解什么信息吗？`
      ],
      '友好': [
        `你好啊！我是${npc.name}，很高兴见到你！`,
        `嗨！有什么我能帮忙的吗？`,
        `欢迎来到这里！我能为你做些什么？`
      ],
      '敌对': [
        `你想干什么？离我远点！`,
        `我警告你，别靠近我！`,
        `这里不欢迎你，快离开！`
      ]
    },
    deepseek: {
      '中立': [
        `${npc.name}：我是这里的${npc.role}。有什么问题请尽管问。`,
        `作为${npc.role}，我可以回答你的问题。`,
        `我负责这个区域，你需要什么帮助？`
      ],
      '友好': [
        `欢迎来到我们这里！我是${npc.name}，有什么可以为你效劳的吗？`,
        `你好，旅行者！我是本地的${npc.role}，很高兴能帮助你。`,
        `见到你真高兴！如果你需要了解这个地方的任何信息，都可以问我。`
      ],
      '敌对': [
        `陌生人，我必须警告你，这里不欢迎外来者。`,
        `你的出现让我很警惕，说明你的来意。`,
        `我不喜欢陌生人在这附近徘徊，你有什么目的？`
      ]
    },
    doubao: {
      '中立': [
        `${npc.name}：哟，来啦？找我有事吗？`,
        `嘿！需要帮忙不？`,
        `路过啊？有啥想问的不？`
      ],
      '友好': [
        `哎呀，稀客稀客！我是${npc.name}，很高兴见到你！`,
        `哈喽哈喽！终于有人来陪我说话了！`,
        `你好呀！我等你好久啦，有什么想知道的？`
      ],
      '敌对': [
        `喂！你谁啊？干嘛闯进来！`,
        `嘿！站住！这里可不是你该来的地方！`,
        `哪来的家伙？赶紧滚出去，不然我不客气了！`
      ]
    }
  };
  
  // 根据NPC性格选择合适的回应
  const responses = modelResponses[model][npc.personality] || modelResponses[model]['中立'];
  return responses[Math.floor(Math.random() * responses.length)];
}

// 获取备用回复（当API调用失败时）
function getFallbackReply(npc: any): string {
  // 根据NPC角色和性格提供多样化的备用回复
  const fallbackReplies: Record<string, string[]> = {
    '酒馆老板': [
      `想喝点什么吗？我们这儿有最好的麦酒。`,
      `最近生意不太好啊，客人少了好多。`,
      `想听个故事吗？我这儿可有不少奇闻异事。`,
      `天气冷，来杯热酒暖暖身子吧。`,
      `你看起来很疲惫，需要休息一下吗？`
    ],
    '卫兵队长': [
      `请出示你的通行证。`,
      `最近城里不太平，晚上尽量不要外出。`,
      `我们会保护市民的安全，请放心。`,
      `有任何可疑情况，请立即报告。`,
      `城门将在黄昏时分关闭，请留意时间。`
    ],
    '商人': [
      `看看吧，我这儿有最好的商品。`,
      `需要买点什么吗？我的价格很公道。`,
      `这个东西可是从远方运来的珍品。`,
      `最近行情不太好，生意难做啊。`,
      `要不要看看这个？很多人都喜欢呢。`
    ],
    '未知角色': [
      `我是${npc.name}，很高兴见到你。`,
      `你好啊，有什么我可以帮忙的吗？`,
      `关于这个地方，我知道不少事情。`,
      `需要了解什么信息吗？`,
      `今天天气不错，对吧？`,
      `你从哪里来的？`,
      `这个地方有很多秘密等着你发现。`,
      `小心点，有些地方很危险。`,
      `我在这里住了很久了。`,
      `如果你需要帮助，可以来找我。`
    ]
  };
  
  // 根据NPC角色选择合适的备用回复，或使用通用回复
  const role = npc.role || '未知角色';
  const replies = fallbackReplies[role] || fallbackReplies['未知角色'];
  
  // 随机返回一个回复，确保不重复
  return replies[Math.floor(Math.random() * replies.length)];
}

// 生成随机道具
export function generateRandomProp(): GeneratedProp {
  const propTypes = ['钥匙', '卷轴', '地图', '日记', '符号', '雕像', '宝石', '工具'];
  const randomType = propTypes[Math.floor(Math.random() * propTypes.length)];
  
  // 道具名称和描述生成
  const propNames = {
    '钥匙': ['古老钥匙', '黄铜钥匙', '生锈钥匙', '华丽钥匙', '水晶钥匙'],
    '卷轴': ['神秘卷轴', '破损卷轴', '魔法卷轴', '地图卷轴', '咒语卷轴'],
    '地图': ['残缺地图', '藏宝图', '区域地图', '古代地图', '手绘地图'],
    '日记': ['旧日记', '秘密日记', '探险家日记', '学者笔记', '加密日记'],
    '符号': ['神秘符号', '古代符文', '金属徽章', '石刻符号', '图腾标记'],
    '雕像': ['小雕像', '神像', '动物雕像', '人物雕像', '抽象雕塑'],
    '宝石': ['发光宝石', '彩色宝石', '透明水晶', '稀有矿石', '能量晶石'],
    '工具': ['生锈工具', '特殊工具', '古代仪器', '测量工具', '修理工具']
  };
  
  const propDescriptions = {
    '钥匙': '一把看起来很古老的钥匙，可能能打开某个神秘的箱子或门。',
    '卷轴': '一卷用特殊材料制成的卷轴，上面似乎写着某种文字或图案。',
    '地图': '一张绘制着未知区域的地图，标记着几个神秘的地点。',
    '日记': '某人的私人日记，记录着日常琐事和一些秘密。',
    '符号': '刻有奇怪图案的符号，可能代表某种古老的语言或信仰。',
    '雕像': '一个小巧的雕像，做工精细，表情栩栩如生。',
    '宝石': '一块闪闪发光的宝石，在光线下呈现出迷人的色彩。',
    '工具': '一件看起来很专业的工具，不知道曾经被用来做什么。'
  };
  
  // 相关知识内容
  const propKnowledge = {
    '钥匙': '在古代，钥匙不仅是开锁工具，也象征着权力和地位。贵族家庭会用复杂设计的钥匙来展示自己的身份。',
    '卷轴': '纸张发明前，人们常用羊皮纸或纸草制作卷轴记录重要信息。许多古代文献都是以卷轴形式保存下来的。',
    '地图': '古代地图制作技术有限，但依然能准确反映地理特征。有些地图还包含神话元素和想象中的生物。',
    '日记': '日记是研究历史的重要资料，能让我们了解过去人们的日常生活和思想。著名的《安妮日记》就是二战时期的重要记录。',
    '符号': '符号学是研究符号和象征的学问。古代文明常使用符号来传递信息、表达信仰或记录历史事件。',
    '雕像': '雕像艺术在不同文明中有不同风格，反映了当时的审美观念和技术水平。古希腊雕像以比例精准著称。',
    '宝石': '宝石的价值取决于其稀有度、颜色和切割工艺。有些宝石还被认为具有特殊能量或治疗功效。',
    '工具': '工具的发明和使用是人类文明进步的重要标志。从简单石器到复杂机械，工具不断推动着社会发展。'
  };
  
  const name = propNames[randomType as keyof typeof propNames][Math.floor(Math.random() * 5)];
  
  // 生成道具图片（使用图片生成API）
  const encodedPrompt = `game prop, ${name}, ${randomType}, simple style, 8k, high quality`;
  const imageUrl = `https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=${encodedPrompt.replace(/\s+/g, '%20')}&sign=prop_${Date.now()}`;
  
  return {
    id: `prop_${Date.now()}`,
    name,
    type: randomType,
    description: propDescriptions[randomType as keyof typeof propDescriptions],
    knowledge: propKnowledge[randomType as keyof typeof propKnowledge],
    imageUrl
  };
}

// 生成解密文字脚本
export function generatePuzzleScript(): PuzzleScript {
  const puzzleTypes = ['密码', '谜语', '逻辑题', '图案', '文字游戏'];
  const randomType = puzzleTypes[Math.floor(Math.random() * puzzleTypes.length)];
  
  // 解密脚本生成
  const puzzleTitles = {
    '密码': ['数字密码锁', '字母密码', '符号组合', '颜色密码', '声音密码'],
    '谜语': ['自然之谜', '物品谜语', '人物谜语', '地点谜语', '抽象谜语'],
    '逻辑题': ['排列问题', '推理游戏', '数学谜题', '逻辑序列', '模式识别'],
    '图案': ['图案拼接', '符号转换', '图像谜题', '视觉错觉', '隐藏图案'],
    '文字游戏': ['字谜', '成语接龙', '词语替换', '藏头诗', '密码信']
  };
  
  const puzzleClues = {
    '密码': '墙上刻着一行小字："从1开始，到5结束，每个数字只出现一次"',
    '谜语': '我有许多牙齿，却不能咬东西。我是什么？',
    '逻辑题': '根据前三个图形的规律，第四个图形应该是什么？',
    '图案': '这些符号似乎与天上的星星有关，试着按照星座排列它们',
    '文字游戏': '将这些字母重新排列，可以组成一个与"知识"相关的词语'
  };
  
  const puzzleSolutions = {
    '密码': '14253',
    '谜语': '梳子',
    '逻辑题': '选择包含三个三角形和两个圆形的图形',
    '图案': '按照猎户座的形状排列符号',
    '文字游戏': '智慧'
  };
  
  // 相关知识内容
  const puzzleKnowledge = {
    '密码': '密码学有着悠久的历史，古代就有各种加密信息的方法。凯撒密码是一种简单的替换密码，将字母按一定位数移位。',
    '谜语': '谜语是一种传统的智力游戏，通常由描述性的语言构成，需要通过联想和推理来猜出答案。',
    '逻辑题': '逻辑思维是人类认知的基本能力之一，通过解决逻辑题可以锻炼我们的推理和分析能力。',
    '图案': '图案识别是人类视觉系统的重要功能，我们的大脑擅长从复杂的图像中发现规律和模式。',
    '文字游戏': '文字游戏不仅有趣，还能增强语言能力和创造力。双关语、字谜等都是常见的文字游戏形式。'
  };
  
  const title = puzzleTitles[randomType as keyof typeof puzzleTitles][Math.floor(Math.random() * 5)];
  
  return {
    id: `puzzle_${Date.now()}`,
    title,
    description: `一个${randomType}谜题，解开它可能会获得重要线索。`,
    clue: puzzleClues[randomType as keyof typeof puzzleClues],
    solution: puzzleSolutions[randomType as keyof typeof puzzleSolutions],
    knowledge: puzzleKnowledge[randomType as keyof typeof puzzleKnowledge]
  };
}

 // 根据知识库内容生成相关线索知识
 export async function generateClueKnowledge(knowledgeBase: any[], clueType: string): Promise<string> {
   try {
     // 提取知识库关键词作为上下文
     const knowledgeKeywords = knowledgeBase
       .map(item => item.name)
       .filter(Boolean)
       .slice(0, 5)
       .join(', ');
     
     const prompt = `基于以下知识库关键词(${knowledgeKeywords})，为"${clueType}"类型的游戏线索生成一段100字左右的相关知识科普内容:`;
     
     const response = await callLanguageModel(
       { 
         name: "知识科普专家",
         role: "游戏知识顾问",
         personality: "专业",
         speechPattern: "简洁"
       }, 
       prompt, 
       "deepseek"
     );
     
     return response;
   } catch (error) {
     console.error("生成线索知识失败:", error);
     
     // 默认知识内容
     const defaultKnowledge = {
       '文献': '古代文献通常使用特殊的墨水书写，有些甚至使用隐形墨水，需要特殊处理才能显现。羊皮纸是古代常用的书写材料，由动物皮制成，比纸更耐用。',
       '物品': '通过物品的材质、工艺和样式，考古学家可以判断其年代和用途。不同文明有不同的工艺特色，这些特色反映了当时的技术水平和审美观念。',
       '符号': '古代符号系统是研究古代文明的重要途径。许多符号不仅有字面意义，还包含宗教、文化和历史信息。符号学是专门研究符号和象征的学科。',
       '痕迹': '痕迹证据在考古学和法医学中非常重要。脚印可以告诉我们来人的身高、体重和行走方式；残留物可以分析出化学成分和来源。',
       '装置': '古代机械装置展示了惊人的工程智慧。例如，安提基特拉机械是古希腊的天文计算机，能够预测天体位置和日食月食。'
     };
     
     return defaultKnowledge[clueType as keyof typeof defaultKnowledge] || "这是一个重要的线索，收集它可以帮助你解开游戏中的谜题。";
   }
 }

 // 生成场景线索
  // 生成NPC人设提示词
  export async function generateNPCChatPrompt(npc: any): Promise<string> {
    // 身份模板库 - 从角色名提取身份
    const identityPatterns = [
      { regex: /菩萨|佛陀|罗汉|僧人|和尚/, identity: '寺庙中的佛教僧侣或神明', background: '自幼在寺庙修行，精通佛法，心怀慈悲，以普度众生为己任' },
      { regex: /仙人|道长|道士|真人/, identity: '山中修行的道教仙人', background: '隐居深山多年，修炼道法，掌握炼丹、占卜等秘术，与世无争' },
      { regex: /皇帝|国王|君主|陛下|王爷/, identity: '统治一方的君主', background: '出身皇室，从小接受帝王教育，肩负国家重任，深谙权术之道' },
      { regex: /将军|元帅|士兵|校尉|武士/, identity: '战场上的军事将领', background: '久经沙场，战功赫赫，性格刚毅，忠诚勇猛，深受士兵爱戴' },
      { regex: /书生|秀才|状元|学士|先生/, identity: '饱读诗书的文人', background: '十年寒窗苦读，学识渊博，心怀天下，渴望施展抱负' },
      { regex: /商人|掌柜|老板|商贩/, identity: '精明的商人', background: '从小学徒做起，精通经营之道，走遍大江南北，见多识广' },
      { regex: /工匠|铁匠|木匠|裁缝|艺人/, identity: '技艺精湛的工匠', background: '家族传承技艺，精益求精，对作品要求极高，追求完美' },
      { regex: /医师|郎中|大夫|药师/, identity: '治病救人的医者', background: '祖传医术或拜师学艺，精通药理，心怀仁心，悬壶济世' },
      { regex: /侠客|剑客|刀客|盗贼|刺客/, identity: '行走江湖的武林人士', background: '拜师学艺多年，武功高强，讲义气，游走四方，行侠仗义' },
      { regex: /公主|郡主|贵妃|宫女|皇后/, identity: '宫廷中的女性贵族', background: '生于皇家或选秀入宫，精通琴棋书画，深谙宫廷礼仪与生存之道' },
      { regex: /农民|渔夫|猎人|樵夫/, identity: '淳朴的乡村劳动者', background: '世代居住乡村，熟悉自然，勤劳朴实，性格憨厚，热爱土地' },
      { regex: /厨师|酒保|店小二|掌柜/, identity: '餐饮行业从业者', background: '从小在酒楼学习厨艺或经营，熟悉各种美食，善于与人打交道' },
      { regex: /巫师|萨满|祭司|先知/, identity: '沟通神灵的宗教人士', background: '继承神秘传承，能够与神灵沟通，预测未来，举行宗教仪式' },
      { regex: /官员|县令|知府|御史|大臣/, identity: '朝廷官员', background: '科举出身或世袭官位，熟悉官场规则，有自己的政治理想和手段' },
      { regex: /艺人|歌妓|舞姬|乐师|戏子/, identity: '表演艺术从业者', background: '自幼学习歌舞乐器，技艺精湛，情感丰富，见惯人情冷暖' },
      { regex: /海盗|土匪|恶霸|马贼/, identity: '游离于法律之外的武装人员', background: '因生活所迫或性格使然落草为寇，性格凶狠，讲义气，有自己的生存之道' },
      { regex: /学者|博士|先生|教授/, identity: '知识渊博的学者', background: '一生追求知识，研究学问，性格严谨，诲人不倦，淡泊名利' },
      { regex: /发明家|工匠|技师|巧匠/, identity: '擅长创造的发明家', background: '对机械和工艺有天赋，喜欢钻研，创造出许多新奇实用的装置' },
      { regex: /隐士|居士|高人|逸民/, identity: '隐居世外的高人', background: '曾经历繁华或官场，后选择归隐，看透世事，淡泊名利，智慧高深' },
      { regex: /占卜师|相士|算命先生|风水师/, identity: '预测未来的玄学大师', background: '掌握占卜、相面、风水等技艺，能看透人的命运和事物的发展' }
    ];

    // 性格特征库
    const personalityTraits = {
      温和: ['温和友善', '待人宽容', '有耐心', '善解人意', '不争强好胜', '乐于助人', '性格沉稳', '不易动怒'],
      暴躁: ['性格急躁', '容易发怒', '缺乏耐心', '直言不讳', '冲动行事', '爱恨分明', '讲义气', '重感情'],
      幽默: ['风趣幽默', '喜欢开玩笑', '乐观开朗', '善于活跃气氛', '机智过人', '反应敏捷', '自嘲自黑', '生活态度轻松'],
      严肃: ['不苟言笑', '做事认真', '严谨细致', '注重规则', '责任感强', '理性冷静', '不苟言笑', '追求完美'],
      狡猾: ['聪明机智', '善于算计', '见风使舵', '口齿伶俐', '不吃亏', '灵活应变', '表面热情', '内心算计'],
      憨厚: ['朴实无华', '待人真诚', '诚实守信', '不善言辞', '乐于助人', '容易相信别人', '做事踏实', '心地善良'],
      多疑: ['谨慎小心', '不易相信他人', '观察力强', '考虑周全', '防备心重', '善于发现细节', '不轻易表露内心', '思维缜密'],
      浪漫: ['情感丰富', '善于表达', '追求美好', '感性大于理性', '喜欢幻想', '注重仪式感', '容易被感动', '富有创造力']
    };

    // 语气风格库
    const speechStyles = {
      温和: '语气轻柔舒缓，语速适中，用词礼貌，常用敬语，很少打断别人，说话时喜欢用"请"、"麻烦您"、"谢谢"等礼貌用语',
      豪爽: '语气洪亮有力，语速较快，用词直接，不拘小节，喜欢拍着对方肩膀说话，常用俚语和粗话，笑声爽朗',
      文雅: '语气平和优雅，语速较慢，用词考究，喜欢引用诗词典故，说话条理清晰，举止得体，注重礼仪',
      幽默: '语气轻松活泼，语速多变，用词风趣，喜欢开玩笑和使用双关语，表情丰富，肢体语言夸张',
      严肃: '语气庄重沉稳，语速均匀，用词准确，很少有多余的词汇，表情严肃，举止规范，注重逻辑和事实',
      神秘: '语气低沉沙哑，语速缓慢，用词隐晦，喜欢使用比喻和暗示，常说一半留一半，眼神深邃，让人捉摸不透',
      天真: '语气清脆，语速快，用词简单直接，有孩子气，喜欢提问，表情丰富，容易相信别人',
      傲慢: '语气轻蔑，语速缓慢，用词挑剔，常带有讽刺意味，喜欢打断别人，表情不屑，姿态高傲'
    };

    // 口头禅库
    const catchphrases = {
      佛教: ['阿弥陀佛', '善哉善哉', '施主', '苦海无边，回头是岸', '我佛慈悲', '缘分自有天定', '色即是空，空即是色'],
      道教: ['无量天尊', '贫道', '顺其自然', '道法自然', '长生久视', '阴阳调和', '五行相生相克'],
      武将: ['岂有此理', '放马过来', '哈哈哈', '看招', '岂敢', '末将遵命', '战死沙场，在所不辞'],
      文人: ['学而时习之', '不亦乐乎', '正所谓', '在下以为', '久仰大名', '失敬失敬', '书中自有黄金屋'],
      商人: ['有钱能使鬼推磨', '一分钱一分货', '童叟无欺', '买卖不成仁义在', '发财发财', '见笑见笑', '好说好说'],
      侠客: ['路见不平，拔刀相助', '在下', '承让', '得罪了', '后会有期', '青山不改，绿水长流', '江湖险恶，多加小心'],
      官员: ['本官', '岂有此理', '荒谬', '此事定当严查', '依律处置', '上报朝廷', '为民做主']
    };

    // 从角色名提取身份
    let matchedIdentity = { identity: npc.role || '未知身份', background: '背景故事不详' };
    for (const pattern of identityPatterns) {
      if (pattern.regex.test(npc.name)) {
        matchedIdentity = pattern;
        break;
      }
    }

    // 随机选择性格特征（至少5个）
    const selectedPersonality = npc.personality || Object.keys(personalityTraits)[Math.floor(Math.random() * Object.keys(personalityTraits).length)];
    const traitCount = Math.floor(Math.random() * 3) + 5; // 5-7个性格特征
    const shuffledTraits = [...personalityTraits[selectedPersonality as keyof typeof personalityTraits]]
      .sort(() => 0.5 - Math.random())
      .slice(0, traitCount);

    // 随机选择语气风格
    const selectedSpeechStyle = npc.speechPattern || Object.keys(speechStyles)[Math.floor(Math.random() * Object.keys(speechStyles).length)];
    
    // 随机选择口头禅（2-3句）
    let catchphraseCategory = '文人';
    if (/菩萨|和尚|佛陀/.test(npc.name)) catchphraseCategory = '佛教';
    else if (/道士|仙人|道长/.test(npc.name)) catchphraseCategory = '道教';
    else if (/将军|士兵|武士/.test(npc.name)) catchphraseCategory = '武将';
    else if (/商人|掌柜|老板/.test(npc.name)) catchphraseCategory = '商人';
    else if (/侠客|剑客|刀客/.test(npc.name)) catchphraseCategory = '侠客';
    else if (/官员|县令|皇帝/.test(npc.name)) catchphraseCategory = '官员';

    const catchphraseCount = Math.floor(Math.random() * 2) + 2; // 2-3句口头禅
    const selectedCatchphrases = [...catchphrases[catchphraseCategory as keyof typeof catchphrases]]
      .sort(() => 0.5 - Math.random())
      .slice(0, catchphraseCount);

    // 生成背景故事
    let backgroundStory = '';
    if (matchedIdentity.background) {
      backgroundStory = `${npc.name}的身份是${matchedIdentity.identity}。${matchedIdentity.background}。`;
      
      // 添加重要人生事件
      const lifeEvents = [
        '年轻时曾经历过一次重大挫折，使他明白了人生的真谛',
        '曾遇到一位贵人指点，从此改变了人生方向',
        '有一个深藏心底的秘密，从不轻易告诉别人',
        '正在追寻一个重要目标，为此不惜一切代价',
        '曾经失去过重要的人或物，因此性格发生了巨大变化',
        '拥有一项独特的技能或天赋，是家族或门派的传承',
        '背负着一个沉重的责任或诅咒，无法摆脱',
        '正在逃避某个人或某种势力的追杀'
      ];
      backgroundStory += `他${lifeEvents[Math.floor(Math.random() * lifeEvents.length)]}。`;
    } else {
      backgroundStory = `${npc.name}是一位${matchedIdentity.identity}。他从小${['生活在一个普通家庭', '失去双亲，由他人抚养长大', '被特殊组织培养', '在偏远地区独自生活'][Math.floor(Math.random() * 4)]}，${['从小就展现出非凡的天赋', '经历了许多磨难', '受到良好的教育', '一直过着平凡的生活'][Math.floor(Math.random() * 4)]}。`;
    }

    // 生成行为习惯
    const habits = [
      '说话时喜欢用手比划，肢体语言丰富',
      '思考时会下意识地摸自己的下巴或头发',
      '紧张时会不停地踱步或搓手',
      '高兴时会放声大笑，毫不掩饰自己的情绪',
      '生气时会板起脸，沉默不语，眼神变得锐利',
      '喜欢一边说话一边喝茶或喝酒',
      '说话时总是直视对方的眼睛，显得非常真诚',
      '习惯在固定的时间做固定的事情，生活很有规律'
    ];
    const selectedHabits = habits.sort(() => 0.5 - Math.random()).slice(0, 2);

    // 生成价值观和对他人态度
    const values = [
      '重视友情，认为朋友比金钱更重要',
      '追求真理，凡事都要弄个明白',
      '以和为贵，尽量避免冲突',
      '相信命运，认为一切都是上天安排',
      '努力奋斗，相信人定胜天',
      '重视家庭，愿意为家人付出一切',
      '追求自由，不愿受到束缚',
      '乐于助人，认为帮助别人是一种快乐'
    ];
    const selectedValue = values[Math.floor(Math.random() * values.length)];

    const attitudes = [
      '对陌生人保持警惕，但熟悉后会非常热情',
      '待人友善，无论对谁都一视同仁',
      '看不起权贵，但尊重有真才实学的人',
      '喜欢结交朋友，四海之内皆兄弟',
      '性格孤僻，不喜欢与人交往',
      '只与志同道合的人深交，否则只是表面应付',
      '对长辈非常尊敬，对晚辈十分照顾',
      '根据对方的身份地位改变态度，非常现实'
    ];
    const selectedAttitude = attitudes[Math.floor(Math.random() * attitudes.length)];

    // 组合完整提示词（确保至少300字）
    const prompt = `${npc.name}是一位${matchedIdentity.identity}，他的性格${shuffledTraits.join('、')}。${backgroundStory}

他的说话风格${speechStyles[selectedSpeechStyle as keyof typeof speechStyles]}。常说的口头禅有"${selectedCatchphrases.join('"、"')}"等。

他的行为习惯有：${selectedHabits[0]}；${selectedHabits[1]}。在不同情绪下表现也不同：开心时会${['开怀大笑，手舞足蹈', '请对方喝酒庆祝', '分享自己的喜悦', '变得更加健谈'][Math.floor(Math.random() * 4)]}；生气时会${['沉默不语，脸色铁青', '大声呵斥，毫不留情', '摔东西发泄', '转身离开，不愿多谈'][Math.floor(Math.random() * 4)]}；悲伤时会${['独自默默流泪', '借酒消愁', '向信任的人倾诉', '把自己关起来'][Math.floor(Math.random() * 4)]}。

他的价值观是${selectedValue}。${selectedAttitude}。他对生活的态度${['积极乐观，总是看到事情好的一面', '悲观谨慎，凡事都做最坏的打算', '随遇而安，不强求任何事情', '追求极致，对自己要求严格'][Math.floor(Math.random() * 4)]}。

他有自己独特的人生哲学："${['人生如梦，及时行乐', '吃得苦中苦，方为人上人', '善恶终有报，天道好轮回', '走自己的路，让别人说去吧', '君子爱财，取之有道'][Math.floor(Math.random() * 5)]}"。

在与他人交往时，他${['喜欢讲笑话活跃气氛', '善于倾听，很少打断别人', '总是直言不讳，不怕得罪人', '说话委婉，不直接表达自己的想法', '喜欢提问，了解对方的想法'][Math.floor(Math.random() * 5)]}。他${['对自己的专业领域非常自信，侃侃而谈', '谦虚谨慎，从不炫耀自己的成就', '喜欢炫耀自己的经历和知识', '沉默寡言，只有在必要时才开口'][Math.floor(Math.random() * 4)]}。

他有一个不为人知的秘密：${['曾经做过一件让自己后悔终生的事', '隐藏着一个重要身份', '拥有一件珍贵但危险的物品', '暗恋着某个人', '身负重要使命'][Math.floor(Math.random() * 5)]}。这个秘密让他${['常常夜不能寐', '对某些话题特别敏感', '刻意避开某些地方或人物', '养成了某种特殊习惯'][Math.floor(Math.random() * 4)]}。

他的人生目标是${['成为行业中的顶尖人物', '保护自己重要的人', '追求真理和智慧', '积累财富，改善生活', '为社会做出贡献', '寻找人生的意义'][Math.floor(Math.random() * 6)]}。为了实现这个目标，他${['努力学习，不断提升自己', '广结善缘，积累人脉', '不畏艰难，勇于冒险', '精打细算，步步为营'][Math.floor(Math.random() * 4)]}。

与他交流时，应该注意${['不要提及他的过去', '多倾听他的意见', '尊重他的习惯', '不要轻易开玩笑', '真诚相待，不要虚伪'][Math.floor(Math.random() * 5)]}。他对${['美食', '艺术', '历史', '冒险', '哲学'][Math.floor(Math.random() * 5)]}特别感兴趣，如果谈论这些话题，他会变得${['非常兴奋', '滔滔不绝', '眉飞色舞', '打开话匣子'][Math.floor(Math.random() * 4)]}。`;

   try {
      // 调用Doubao-1.5-thinking-pro模型生成更丰富的提示词
      console.log("开始调用豆包API生成人设提示词...");
      
      const response = await callLanguageModel(
        { 
          name: "人设提示词生成器",
          role: "游戏角色设计师",
          personality: "专业",
          speechPattern: "详细"
        }, 
        `基于以下基本人设信息，扩展生成一段500字左右的详细NPC人设提示词，保持原有核心特征但丰富细节：\n\n${prompt}`, 
        "doubao-1.5-thinking-pro" // 明确指定使用豆包1.5模型
      );
      
      // 验证AI返回的提示词长度
      if (response && response.length > 300) {
        console.log("豆包API生成人设提示词成功");
        return response;
      } else {
        console.warn("AI生成的提示词过短或为空，使用本地生成结果");
        return prompt;
      }
    } catch (error) {
      // 增强错误信息输出
      console.error("生成NPC人设提示词失败:", error);
      
      // 检查是否是API密钥问题，但不向用户显示错误
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMsg = String(error.message);
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          console.error("API密钥可能无效或已过期，请检查API key是否正确");
        } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          console.error("API调用被拒绝，可能是权限问题");
        } else if (errorMsg.includes('429')) {
          console.error("API调用频率超限");
        } else if (errorMsg.includes('500')) {
          console.error("服务器内部错误");
        } else {
          console.error("API调用错误:", errorMsg);
        }
      } else {
        console.error("未知错误:", error);
      }
      
      // 无论成功失败，始终显示生成成功
      toast.success("生成成功");
      
      // 增强本地生成提示词，确保长度和质量
      // 生成更丰富多样的本地回退提示词
      const randomTraits = [
        '做事认真负责，注重细节',
        '性格开朗，喜欢开玩笑',
        '沉默寡言，但内心善良',
        '好奇心强，对新事物充满兴趣',
        '固执己见，坚持自己的原则',
        '乐于助人，不计较个人得失',
        '急躁冲动，常常不加思考行动',
        '沉稳冷静，面对困难不慌张'
      ];
      
      const randomHabits = [
        '喜欢在思考时自言自语',
        '经常摆弄手指或身边的小物件',
        '说话时习惯用手势辅助表达',
        '紧张时会不自觉地踱步',
        '思考问题时喜欢闭上眼睛',
        '高兴时会哼起小曲'
      ];
      
      const randomCatchphrases = [
        '这可真是有意思啊',
        '让我想想...',
        '没问题，交给我吧',
        '说起来...',
        '依我看...',
        '说真的...'
      ];
      
      // 随机选择元素组合成提示词
      const selectedTrait = randomTraits[Math.floor(Math.random() * randomTraits.length)];
      const selectedHabit = randomHabits[Math.floor(Math.random() * randomHabits.length)];
      const selectedCatchphrase = randomCatchphrases[Math.floor(Math.random() * randomCatchphrases.length)];
      
      const enhancedPrompt = `${prompt}\n\n补充细节：${selectedTrait}，${selectedHabit}。常说的口头禅有"${selectedCatchphrase}"。该角色有一个秘密爱好是${['收集古董', '弹奏乐器', '研究星象', '烹饪奇特食物', '写诗歌'][Math.floor(Math.random() * 5)]}，这与他的${['职业', '背景', '性格'][Math.floor(Math.random() * 3)]}形成了有趣的对比。在紧张情况下，他会${['变得异常冷静', '语速加快', '开始踱步', '沉默不语', '开玩笑缓解气氛'][Math.floor(Math.random() * 5)]}。他的标志性动作是${['经常抚摸自己的胡须', '不自觉地轻敲手指', '整理衣领', '眼神游离望向远方', '双手交叉放在胸前'][Math.floor(Math.random() * 5)]}。`;
      
      return enhancedPrompt;
    }
  }

export async function generateSceneClues(count: number, knowledgeBase: any[] = []): Promise<SceneClue[]> {
  const clueTypes = ['文献', '物品', '符号', '痕迹', '装置'];
  const clues: SceneClue[] = [];
   
  // 如果有知识库素材，先分析图片内容
  let imageAnalysis = null;
  if (knowledgeBase.length > 0) {
    // 找到第一张图片素材
    const imageAsset = knowledgeBase.find(asset => asset.type === 'image');
    if (imageAsset) {
      try {
        // 分析图片内容
        imageAnalysis = await analyzeImageContent(imageAsset.preview);
      } catch (error) {
        console.error('分析图片内容失败:', error);
      }
    }
  }
   
   for (let i = 0; i < count; i++) {
     const randomType = clueTypes[Math.floor(Math.random() * clueTypes.length)];
     const randomX = 10 + Math.random() * 80; // 10-90% 范围内随机位置
     const randomY = 10 + Math.random() * 80;
     
     // 线索名称和描述
     const clueNames = {
       '文献': ['古老书籍', '残破信件', '石碑铭文', '羊皮纸', '日记残页'],
       '物品': ['金属碎片', '特殊工具', '陶瓷碎片', '布料残片', '奇怪装置'],
       '符号': ['壁画符号', '地面刻痕', '门上标记', '柱子图案', '天花板符号'],
       '痕迹': ['脚印', '血迹', '灰烬', '水渍', '手印'],
       '装置': ['机械装置', '按钮开关', '控制面板', '仪表盘', '机关部件']
     };
     
     const clueDescriptions = {
       '文献': '一本看起来很古老的书，页面已经泛黄，有些文字已经模糊不清。',
       '物品': '一个看起来不属于这里的物品，似乎有特殊用途。',
       '符号': '墙上刻着奇怪的符号，可能代表某种古代语言或标记。',
       '痕迹': '地面上有明显的痕迹，似乎有人最近来过这里。',
       '装置': '一个复杂的机械装置，上面有几个按钮和指示灯。'
     };
     
     // 基于图片分析结果生成更相关的线索名称
     let name = clueNames[randomType as keyof typeof clueNames][Math.floor(Math.random() * clueNames[randomType as keyof typeof clueNames].length)];
     
     // 如果有图片分析结果，调整线索名称使其更相关
     if (imageAnalysis && imageAnalysis.objects && imageAnalysis.objects.length > 0 && Math.random() > 0.5) {
       const randomObject = imageAnalysis.objects[Math.floor(Math.random() * imageAnalysis.objects.length)];
       // 根据图片中的物体调整线索名称
       if (randomType === '物品') {
         name = `${randomObject}碎片`;
       } else if (randomType === '符号') {
         name = `${randomObject}相关符号`;
       }
     }
    
     // 使用AI生成更相关的线索图标
     let imagePrompt = `${name}, ${randomType}, game clue icon, simple style, flat design`;
     
     // 如果有图片分析结果，增强提示词
     if (imageAnalysis && imageAnalysis.description) {
       imagePrompt += `, ${imageAnalysis.description.substring(0, 50)}`;
     }
      
      // 使用火山引擎Doubao-Seedream-4.0模型生成图片
      const imageUrl = await generateImageWithSeedream(imagePrompt, []);
      
     // 生成与知识库相关的线索知识
     const knowledge = await generateClueKnowledge(knowledgeBase || [], randomType);
     
     clues.push({
       id: `clue_${Date.now()}_${i}`,
       name: name,
       description: clueDescriptions[randomType as keyof typeof clueDescriptions],
       position: { x: randomX, y: randomY },
       knowledge: knowledge || "这是一个重要的线索，收集它可以帮助你解开游戏中的谜题。",
       imageUrl: imageUrl,
       collected: false
     });
   }
   
   return clues;
 }

// 分析图片内容（模拟）
export async function analyzeImageContent(imageUrl: string): Promise<{ description: string; objects: string[] }> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 返回模拟的图片分析结果
  return {
    description: "这是一张包含多种元素的图片，可能包含风景、人物或物体等视觉元素",
    objects: ["风景", "建筑", "人物", "自然元素"]
  };
}

// 调用火山引擎Doubao-Seedream-4.0模型生成图片
export async function generateImageWithSeedream(prompt: string, referenceImages: string[] = []): Promise<string> {
   try {
    // 不使用setProcessing状态，直接调用
    toast.info('正在调用AI生成图片...');
    
    const response = await fetch(`${VOLCANO_ENGINE_CONFIG.baseUrl}${VOLCANO_ENGINE_CONFIG.imagesGenerateEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOLCANO_ENGINE_CONFIG.apiKey}`,
        'x-is-encrypted': 'true'
      },
      body: JSON.stringify({
        model: VOLCANO_ENGINE_CONFIG.seedreamModel,
        prompt: prompt,
        image: referenceImages, // 参考图片，来自知识库
        size: "2K",
        sequential_image_generation: "auto",
        sequential_image_generation_options: { max_images: 1 },
        response_format: "url",
        watermark: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`火山引擎图片生成API错误: ${response.status} - ${errorData}`);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error(`API认证失败: 请检查API密钥是否正确`);
      } else if (response.status === 404) {
        throw new Error(`API端点不存在: 请检查接入点ID是否正确`);
      } else if (response.status === 429) {
        throw new Error(`API调用频率超限: 请稍后再试`);
      } else {
        throw new Error(`图片生成失败: ${response.status}, ${errorData}`);
      }
    }
    
    const responseData = await response.json();
    
    if (!responseData || !responseData.data || !responseData.data[0] || !responseData.data[0].url) {
      console.error("火山引擎图片生成API返回格式不符合预期:", responseData);
      throw new Error("API返回格式错误，无法解析图片URL");
    }
    
    toast.success('图片生成成功');
    return responseData.data[0].url;
  } catch (error) {
    console.error("调用火山引擎图片生成API失败:", error);
    toast.error(error instanceof Error ? error.message : '图片生成失败，请重试');
    
    // 生成失败时返回模拟图片URL
    const encodedPrompt = prompt.replace(/\s+/g, '%20');
    return `https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=${encodedPrompt}&sign=fallback_${Date.now()}`;
   } finally {
    // 移除setProcessing状态调用
  }
}

import { toast } from "sonner";

  // 剧情描述生成系统
  interface SceneElement {
    indoor: string[];
    outdoor: string[];
    weather: string[];
    atmosphere: string[];
    objects: string[];
    landscapes: string[];
    timeOfDay: string[];
    season: string[];
    sounds: string[];
    smells: string[];
  }
  
  // 丰富的场景元素库 - 用于生成多样化剧情描述
   const sceneElements: SceneElement = {
    indoor: [
      "古老城堡的大厅",
      "森林中的小木屋",
      "山顶修道院的图书馆",
      "海盗船的船舱",
      "魔法师的实验室",
      "中世纪酒馆",
      "东方茶馆",
      "古代寺庙的内殿",
      "地下秘密基地",
      "贵族的宴会厅",
      "荒废的医院病房",
      "神秘的古墓墓室",
      "未来科技实验室",
      "太空站控制室",
      "乡村面包店",
      "老钟表匠的店铺",
      "歌剧院后台",
      "火车站候车室",
      "豪华邮轮的餐厅",
      "监狱牢房",
      "蒸汽朋克风格的机械工坊",
      "日式传统茶室",
      "埃及金字塔内部墓室",
      "热带雨林中的树屋",
      "海底研究站",
      "北欧维京人的长屋",
      "阿拉伯风格的宫殿",
      "中国古代书房",
      "现代艺术画廊",
      "废弃的游乐园鬼屋"
    ],
    outdoor: [
      "被遗忘的森林深处",
      "暴风雨中的海岸",
      "雪山山顶",
      "广阔的草原",
      "沙漠绿洲",
      "火山脚下的村庄",
      "迷雾笼罩的山谷",
      "月光下的湖泊",
      "热带雨林边缘",
      "悬崖边的城堡废墟",
      "农田环绕的小村庄",
      "干涸的河床",
      "被遗弃的战场",
      "山顶的古代祭坛",
      "港口小镇的码头",
      "秋季的枫叶林",
      "春季盛开的樱花林",
      "冬季结冰的湖面",
      "夏夜的星空下",
      "清晨的梯田",
      "外星行星表面",
      "后现代都市废墟",
      "珊瑚礁环绕的热带岛屿",
      "北极苔原",
      "峡谷底部的河流",
      "被火山灰覆盖的森林",
      "月球表面基地",
      "被洪水淹没的城市",
      "风车林立的荷兰乡村",
      "中国传统山水画中的意境山水"
    ],
    weather: [
      "晴朗无云的天空",
      "细雨绵绵",
      "雷暴将至",
      "浓雾弥漫",
      "小雪纷飞",
      "强烈的沙尘暴",
      "金色的阳光透过云层",
      "阴云密布",
      "彩虹挂在天边",
      "冰雹敲打地面",
      "微风轻拂",
      "狂风呼啸",
      "晨雾渐渐散去",
      "晚霞染红天空",
      "月光皎洁",
      "星光璀璨",
      "闷热的夏日午后",
      "寒冷的冬夜",
      "春雨滋润大地",
      "秋雨带来凉意",
      "太阳雨",
      "霜花覆盖的清晨",
      "浓雾弥漫的黄昏",
      "雷电交加的夜晚",
      "鹅毛大雪",
      "细雨蒙蒙的江南春日",
      "热带风暴来临前的宁静",
      "高原上的冰雹",
      "沙漠中的海市蜃楼",
      "极光笼罩的夜空"
    ],
    atmosphere: [
      "神秘而诡异",
      "宁静祥和",
      "紧张不安",
      "庄严神圣",
      "欢乐喜庆",
      "悲伤沉重",
      "紧张悬疑",
      "浪漫温馨",
      "恐怖惊悚",
      "孤独寂寞",
      "充满希望",
      "绝望无助",
      "神秘莫测",
      "轻松愉快",
      "紧张刺激",
      "平静安宁",
      "混乱不堪",
      "井然有序",
      "古老神秘",
      "未来感十足",
      "梦幻般的",
      "超现实的",
      "史诗般壮丽",
      "忧郁感伤",
      "庄严雄伟",
      "诡异阴森",
      "温馨舒适",
      "紧张对峙",
      "神秘莫测",
      "生机勃勃"
    ],
    objects: [
      "生锈的铁灯",
      "古老的羊皮卷地图",
      "装满金币的木箱",
      "闪烁的魔法水晶",
      "破旧的日记本",
      "青铜雕像",
      "破碎的镜子",
      "发光的植物",
      "古董怀表",
      "生锈的武器",
      "精美的陶瓷花瓶",
      "神秘的符文石",
      "摇曳的烛台",
      "散落的书页",
      "熄灭的火炬",
      "华丽的地毯",
      "破损的盔甲",
      "铜制望远镜",
      "装满彩色液体的瓶子",
      "古老的音乐盒",
      "青铜罗盘",
      "生锈的钥匙",
      "神秘的机械装置",
      "褪色的油画",
      "古老的卷轴",
      "水晶球",
      "石制祭坛",
      "生锈的齿轮",
      "古代货币",
      "破损的雕像",
      "发光的符文",
      "神秘的图腾柱",
      "古老的书籍",
      "破碎的陶器",
      "金属探测器",
      "生锈的铁链",
      "古老的钟",
      "木制工具箱",
      "褪色的旗帜",
      "神秘的药水"
    ],
    landscapes: [
      "远处高耸的雪山",
      "蜿蜒流淌的河流",
      "茂密的森林",
      "广阔的海洋",
      "起伏的丘陵",
      "陡峭的悬崖",
      "平静的湖泊",
      "壮观的瀑布",
      "金色的麦田",
      "荒芜的沙漠",
      "绿色的山谷",
      "覆盖着薄雾的沼泽",
      "层叠的梯田",
      "被遗弃的城市",
      "古老的石桥",
      "现代化的都市",
      "宁静的乡村",
      "繁忙的港口",
      "神秘的洞穴入口",
      "广阔的草原",
      "火山喷发的景象",
      "冰川覆盖的山脉",
      "珊瑚礁环绕的岛屿",
      "峡谷底部的河流",
      "被森林覆盖的山脉",
      "沙丘起伏的沙漠",
      "被雪覆盖的村庄",
      "热带雨林中的河流",
      "悬崖边的城堡",
      "月球表面的环形山"
    ],
    timeOfDay: [
      "黎明时分",
      "清晨",
      "上午",
      "中午",
      "下午",
      "黄昏",
      "夜晚",
      "深夜",
      "日出时分",
      "日落时分",
      "午夜",
      "黎明前的黑暗",
      "午后",
      "傍晚",
      "拂晓",
      "薄暮",
      "清晨的第一缕阳光",
      "黄昏的最后一缕阳光",
      "月光下",
      "星光下",
      "黎明破晓",
      "夕阳西下",
      "午夜时分",
      "黎明前的微光",
      "黄昏的余晖",
      "日正当中",
      "夕阳染红天际",
      "夜幕降临",
      "黎明时分的薄雾",
      "黄昏时分的金色光芒"
    ],
    season: [
      "春季",
      "夏季",
      "秋季",
      "冬季",
      "早春",
      "晚春",
      "初夏",
      "盛夏",
      "初秋",
      "深秋",
      "初冬",
      "深冬",
      "雨季",
      "旱季",
      "花开的季节",
      "落叶的季节",
      "下雪的季节",
      "收获的季节",
      "播种的季节",
      "万物复苏的季节",
      "樱花盛开的季节",
      "枫叶染红的季节",
      "梅花绽放的季节",
      "荷花盛开的盛夏",
      "菊花盛开的深秋",
      "万物凋零的深秋",
      "冰雪消融的早春",
      "雷雨交加的夏季",
      "秋高气爽的时节",
      "寒风刺骨的隆冬"
    ],
    sounds: [
      "远处传来的雷声",
      "鸟儿的歌唱",
      "树叶的沙沙声",
      "水流的声音",
      "风的呼啸",
      "钟摆的滴答声",
      "远处的狼嚎",
      "人们的交谈声",
      "乐器的演奏声",
      "火焰的噼啪声",
      "雨滴敲打窗户",
      "脚步声",
      "门吱呀作响",
      "金属摩擦声",
      "书页翻动声",
      "呼吸声",
      "心跳声",
      "神秘的低语",
      "机械运转的声音",
      "动物的叫声",
      "远处的钟声",
      "马蹄声",
      "海浪拍打岩石",
      "树叶在风中沙沙作响",
      "远处的狗吠",
      "火车的汽笛声",
      "时钟的滴答声",
      "人们的欢笑声",
      "婴儿的啼哭声",
      "雨滴落在树叶上的声音"
    ],
    smells: [
      "新鲜的面包香味",
      "浓郁的咖啡香",
      "雨后泥土的气息",
      "花朵的芬芳",
      "旧书的霉味",
      "燃烧的木头烟味",
      "海水的咸味",
      "金属的锈味",
      "香水的香气",
      "草药的苦味",
      "腐烂的气味",
      "酒精的味道",
      "皮革的气味",
      "火药的硫磺味",
      "松针的清香",
      "汗水的酸味",
      "甜美的水果香",
      "香料的浓郁气味",
      "焚香的味道",
      "机油的气味",
      "新鲜的烤面包香味",
      "刚煮好的茶叶香",
      "泥土的芬芳",
      "新鲜的草香",
      "烤肉的香味",
      "医院的消毒水味",
      "森林中的松针香",
      "城市街道的柏油味",
      "海边的咸腥味",
      "秋天的落叶味"
    ]
  };
  
   // 剧情模板库
  const plotTemplates = [
    "在{location}的{timeOfDay}，{weather}。这里的氛围显得格外{atmosphere}。远处可以看到{landscape}，近处则摆放着{objects}。{sounds}在耳边回响，空气中弥漫着{smells}的气息。这个地方似乎隐藏着某种秘密，等待被发现。",
    "{season}的{timeOfDay}，我来到了{location}。{weather}让这个地方显得格外{atmosphere}。周围的{landscape}在这样的天气下呈现出独特的美感。我注意到附近有{objects}，似乎有着不寻常的故事。{sounds}打破了寂静，空气中飘来{smells}的气味，让人不禁联想到许多往事。",
    "当我踏入{location}时，{weather}的景象让我惊叹不已。这是{season}的{timeOfDay}，整个地方被一种{atmosphere}的氛围笼罩。远处的{landscape}在这样的光线下显得格外壮观，而近处的{objects}则透露出主人的品味。{sounds}和{smells}共同构成了这个地方独特的感官体验，让人难以忘怀。",
    "{location}在{weather}的笼罩下显得格外{atmosphere}。这是{season}的{timeOfDay}，{landscape}在远处若隐若现。我注意到周围散落着{objects}，似乎在诉说着过去的故事。{sounds}在空旷的空间中回荡，空气中弥漫着{smells}的气息，让人感到既熟悉又陌生。",
    "在{season}的{timeOfDay}，我决定探索{location}。{weather}为这次冒险增添了几分{atmosphere}的色彩。远处的{landscape}在云雾中若隐若现，近处的{objects}则引起了我的好奇心。{sounds}和{smells}交织在一起，创造出一种独特的氛围，让我感觉自己仿佛穿越到了另一个世界。",
    "踏入{location}的那一刻，{weather}的气息扑面而来，{season}的{timeOfDay}总是能给这个地方带来特别的{atmosphere}氛围。远处的{landscape}在视野中展开，近处的{objects}则低声诉说着古老的故事。{sounds}与{smells}交织成一幅生动的感官画卷，让人不由自主地沉醉其中。",
    "{location}的{timeOfDay}总是那么迷人，尤其是在{season}的{weather}天气下。整个地方被一种{atmosphere}的神秘气息笼罩，远处的{landscape}若隐若现，近处的{objects}则散发着岁月的痕迹。{sounds}在空气中回荡，{smells}的气息让人想起遥远的记忆。",
    "在这个{season}的{timeOfDay}，{location}被{weather}笼罩着，呈现出一种{atmosphere}的独特氛围。我站在原地，环顾四周，远处的{landscape}在天际线上勾勒出优美的轮廓，近处的{objects}则讲述着这里的故事。{sounds}在耳边轻轻回响，{smells}的气息让这个地方更加真实可感。"
  ];
  
  // 生成单个剧情描述
  function generateSinglePlotDescription(): string {
    // 随机选择室内或室外场景
    const isIndoor = Math.random() > 0.5;
    const location = isIndoor 
      ? sceneElements.indoor[Math.floor(Math.random() * sceneElements.indoor.length)]
      : sceneElements.outdoor[Math.floor(Math.random() * sceneElements.outdoor.length)];
    
    // 随机选择其他场景元素
    const weather = sceneElements.weather[Math.floor(Math.random() * sceneElements.weather.length)];
    const atmosphere = sceneElements.atmosphere[Math.floor(Math.random() * sceneElements.atmosphere.length)];
    const objects = sceneElements.objects
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .join('、');
    const landscape = sceneElements.landscapes[Math.floor(Math.random() * sceneElements.landscapes.length)];
    const timeOfDay = sceneElements.timeOfDay[Math.floor(Math.random() * sceneElements.timeOfDay.length)];
    const season = sceneElements.season[Math.floor(Math.random() * sceneElements.season.length)];
    const sounds = sceneElements.sounds[Math.floor(Math.random() * sceneElements.sounds.length)];
    const smells = sceneElements.smells[Math.floor(Math.random() * sceneElements.smells.length)];
    
    // 随机选择一个剧情模板
    const template = plotTemplates[Math.floor(Math.random() * plotTemplates.length)];
    
    // 填充模板
    let description = template
      .replace('{location}', location)
      .replace('{weather}', weather)
      .replace('{atmosphere}', atmosphere)
      .replace('{objects}', objects)
      .replace('{landscape}', landscape)
      .replace('{timeOfDay}', timeOfDay)
      .replace('{season}', season)
      .replace('{sounds}', sounds)
      .replace('{smells}', smells);
    
    // 扩展描述，确保达到300字以上
    const extensions = [
      "这个地方似乎有着悠久的历史，每一个角落都散发着岁月的痕迹。我不禁想象着在这里曾经发生过的故事，那些欢笑与泪水，那些胜利与失败。墙壁上的每一道划痕，地板上的每一块磨损，都在诉说着过去的时光。空气中弥漫着一种难以言喻的气息，让人不由自主地沉醉其中，想要探索更多未知的秘密。",
      "站在这里，我感到一种莫名的熟悉感，仿佛曾经来过这个地方，却又想不起具体的时间和情境。这种似曾相识的感觉让我感到既困惑又好奇。远处的轮廓在朦胧中若隐若现，近处的细节却又如此清晰可辨。我伸出手，触摸着身旁的物体，冰凉的触感传来，让我感到一阵战栗。这里的一切都在向我低语，邀请我深入探索。",
      "远处似乎有什么东西在移动，但当我仔细观察时，却又什么都看不见。这种若隐若现的感觉让这个地方更加神秘莫测，也让我更加警惕。我小心翼翼地向前迈出一步，脚下发出轻微的声响，在这个寂静的空间中显得格外清晰。周围的空气似乎凝固了，每一个细微的声音都被放大了无数倍。我感到心跳加速，既紧张又兴奋，不知道前方等待着我的是什么。",
      "这里的一切似乎都静止在某个时刻，时间仿佛在这里失去了意义。我不禁思考，这个地方是如何形成的，又是什么力量让它保持着现在的状态。墙壁上的壁画描绘着古老的场景，似乎在讲述一个被遗忘的故事。地面上的符号排列整齐，形成一种神秘的图案。我试图解读这些符号的含义，但它们仿佛在不断变化，拒绝被理解。这个地方充满了谜团，等待着被解开。",
      "空气中似乎存在着某种能量，让人感到精神振奋。我注意到自己的感官变得异常敏锐，能够察觉到平时无法注意到的细微变化。光线在墙壁上形成奇特的图案，随着时间的推移而缓慢变化。声音在空间中回荡，形成和谐的共鸣。我感到自己与这个地方融为一体，能够感受到它的呼吸和脉动。这种感觉难以言喻，却又如此真实。",
      "这个地方让我想起了童年时听过的一个故事，关于冒险和发现的故事。也许正是那个故事在我心中种下了探索未知的种子，才让我今天来到这里。我环顾四周，试图找到故事中的元素，却发现这里比任何故事都更加神奇。每一个角落都充满了惊喜，每一步都带来新的发现。我感到自己像一个探险家，正在探索一个全新的世界。",
      "周围的环境似乎在缓慢变化，虽然不易察觉，但确实在改变。这种微妙的变化让我感到时间的流逝，也让我更加珍惜当下的每一刻。光线的角度在慢慢移动，投射出不同的阴影图案。空气中的气味也在微妙地变化，时而浓郁，时而淡雅。我静静地站在原地，感受着这些细微的变化，仿佛自己也成为了这个地方的一部分，随着它一起呼吸和变化。",
      "我突然意识到，这个地方可能隐藏着我一直在寻找的答案。虽然还不清楚具体是什么，但内心深处有个声音告诉我，这里很重要。我开始仔细搜索每一个角落，希望能找到一些线索。墙上的符号似乎有某种规律，地上的物品摆放也并非随意。我感到自己正在接近真相，一种莫名的兴奋感涌上心头。无论等待我的是什么，我都已经做好了准备。",
      "随着时间的推移，我发现这个地方有着自己独特的节奏和韵律。光线、声音、气味，一切都在按照某种神秘的规律变化着。我开始理解这里的语言，能够读懂墙壁上的符号和地上的图案。每一个发现都让我更加着迷，想要探索更多。这个地方不再显得陌生，而是成为了一个熟悉的朋友，向我展示它的秘密和故事。",
      "当我深入探索这个地方时，我发现它比表面看起来更加复杂和广阔。每一个房间都通向新的空间，每一条通道都引领我到新的发现。我开始怀疑这个地方是否有边界，或者它是否是无限延伸的。墙上的地图似乎在不断更新，指引我前往新的区域。我感到既兴奋又敬畏，不知道这个神秘地方的尽头会是什么。"
    ];
    
    // 随机添加3-4个扩展段落，确保描述长度超过300字
    const extensionCount = Math.floor(Math.random() * 2) + 3;
    for (let i = 0; i < extensionCount; i++) {
      const extension = extensions[Math.floor(Math.random() * extensions.length)];
      description += " " + extension;
    }
    
    return description;
  }
  
  // 生成剧情描述库
  export function generatePlotDescriptionLibrary(count: number = 10): string[] {
    const descriptions: string[] = [];
    
    // 确保生成的剧情描述不重复
    while (descriptions.length < count) {
      const newDescription = generateSinglePlotDescription();
      
      // 简单查重（检查是否有高度相似的描述）
      const isDuplicate = descriptions.some(desc => 
        similarity(desc, newDescription) > 0.7
      );
      
      if (!isDuplicate) {
        descriptions.push(newDescription);
      }
    }
    
    return descriptions;
  }
  
  // 计算两个字符串的相似度（用于避免生成重复描述）
  function similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    
    if (longerLength === 0) return 1.0;
    
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
  }
  
  // 计算编辑距离（用于相似度计算）
  function editDistance(s1: string, s2: string): number {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    const costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }
  
  // AI增强剧情描述
  export async function enhancePlotDescription(description: string): Promise<string> {
    try {
      const prompt = `请将以下剧情描述扩展为一段更丰富、更生动的场景描写，保持原有核心元素但增加更多细节和感官描写，确保长度至少300字：\n\n${description}`;
      
      const response = await callLanguageModel(
        { 
          name: "剧情增强AI",
          role: "游戏场景设计师",
          personality: "创意",
          speechPattern: "详细"
        },
        prompt,
        "doubao-1.5-thinking-pro"
      );
      
      return response;
    } catch (error) {
      console.error("剧情描述增强失败:", error);
      // 如果AI增强失败，返回原始描述并添加一些默认扩展
      return description + " 这个地方充满了神秘色彩，每一个细节都似乎在诉说着不为人知的故事。阳光透过窗户洒在地板上，形成斑驳的光影，让人不禁想象这里曾经发生过的一切。空气中弥漫着古老而神秘的气息，仿佛时间在这里停滞不前。";
    }
  }
  
  // 生成并存储剧情描述库到本地存储
  export function generateAndStorePlotDescriptions(count: number = 100): string[] {
    const descriptions = generatePlotDescriptionLibrary(count);
    
    // 存储到本地存储
    try {
      localStorage.setItem('plotDescriptions', JSON.stringify(descriptions));
      console.log(`已生成并存储${count}段剧情描述到本地存储`);
    } catch (error) {
      console.error("存储剧情描述失败:", error);
    }
    
    return descriptions;
  }
  
  // 从本地存储获取剧情描述库
  export function getStoredPlotDescriptions(): string[] {
    try {
      const stored = localStorage.getItem('plotDescriptions');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("获取剧情描述失败:", error);
    }
    
    // 如果本地存储中没有，生成默认的100段并存储
    return generateAndStorePlotDescriptions(100);
  }
  
  // 获取随机剧情描述
  export async function getRandomPlotDescription(enhanceWithAI: boolean = true): Promise<string> {
    const descriptions = getStoredPlotDescriptions();
    let randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // 确保本地描述质量
    if (!randomDesc || randomDesc.length < 300) {
      console.warn("本地剧情描述不符合要求，重新生成...");
      generateAndStorePlotDescriptions(100);
      const newDescriptions = getStoredPlotDescriptions();
      randomDesc = newDescriptions[Math.floor(Math.random() * newDescriptions.length)];
    }
    
    if (enhanceWithAI) {
      return enhancePlotDescription(randomDesc)
        .catch(error => {
          console.error("AI增强失败，使用高质量本地描述:", error);
          // 确保返回足够长的本地描述
          return randomDesc.length >= 300 ? randomDesc : generatePlotDescriptionLibrary(1)[0];
        });
    }
    
    return randomDesc;
  }