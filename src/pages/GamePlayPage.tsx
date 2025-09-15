import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LanguageModel } from '@/lib/utils';
import { toast } from "sonner";
import { callLanguageModel } from '@/lib/utils';

export default function GamePlayPage({ game }: { game?: any }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState(0);
  const [showNPCDialog, setShowNPCDialog] = useState(false);
  const [currentNPC, setCurrentNPC] = useState<any>(null);
  const [dialogMessages, setDialogMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentClue, setCurrentClue] = useState<any>(null);
  const [showClueInfo, setShowClueInfo] = useState(false);
  const [allCluesCollected, setAllCluesCollected] = useState(false);
  
  // 检查游戏是否加载
  useEffect(() => {
    if (!game) {
      toast.error('游戏未找到');
      navigate('/editor');
    } else {
      // 初始化第一个场景的对话
      setDialogMessages([
        {
          speaker: '系统',
          text: '欢迎来到基于您IP的点击式解谜游戏！点击场景中的元素进行互动，与NPC对话获取线索。'
        }
      ]);
    }
  }, [game, navigate]);
  
  // 如果没有游戏数据，显示加载状态
  if (!game) {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-[600px]")}>
        <div className={cn("text-5xl mb-4 text-gray-400")}>
          <i className="fa-solid fa-gamepad"></i>
        </div>
        <h2 className={cn("text-xl font-medium mb-2")}>加载游戏中...</h2>
        <p className={cn("text-gray-400")}>请稍候，正在准备游戏场景</p>
      </div>
    );
  }
  
   // 处理线索点击
   const handleClueClick = async (clue: any) => {
     setCurrentClue(clue);
     setShowClueInfo(true);
     
     // 将线索标记为已收集
     const updatedGame = {...game};
     const sceneIndex = updatedGame.scenes.findIndex((s: any) => s.id === game.scenes[currentScene].id);
     if (sceneIndex !== -1) {
       const clueIndex = updatedGame.scenes[sceneIndex].clues.findIndex((c: any) => c.id === clue.id);
       if (clueIndex !== -1) {
         updatedGame.scenes[sceneIndex].clues[clueIndex].collected = true;
         
         // 添加线索收集提示
         setDialogMessages(prev => [...prev, {
           speaker: '系统',
           text: `你发现了${clue.name}！已添加到你的线索收集品中。`
         }]);
         
         // 检查是否收集完所有线索
         const uncollectedClues = updatedGame.scenes[sceneIndex].clues.filter((c: any) => !c.collected);
          if (uncollectedClues.length === 0) {
            setTimeout(() => {
              toast.success('恭喜！你已收集完当前场景所有线索！');
              setDialogMessages(prev => [...prev, {
                speaker: '系统',
                text: '恭喜！你已收集完当前场景所有线索，可以前往下一场景了！'
              }]);
              setAllCluesCollected(true); // 设置所有线索已收集状态
            }, 800);
          }
       }
     }
   };
   
   // 处理NPC对话
   const handleNPCInteraction = async (npc: any) => {
     setCurrentNPC(npc);
     setShowNPCDialog(true);
     setDialogMessages([]); // 清空对话历史
     
     // 根据NPC性格和身份生成不同的初始问候语
     const greetings: Record<string, string[]> = {
      '中立': [
        `你好，我是${npc.name}。作为这里的${npc.role}，有什么可以帮助你的吗？`,
        `我是${npc.name}，负责这里的${npc.role}工作。需要什么帮助吗？`
      ],
      '友好': [
        `哎呀，欢迎欢迎！我是${npc.name}，很高兴见到你！`,
        `你好呀！我是这里的${npc.role}${npc.name}，有什么我能帮忙的吗？`
      ],
      '敌对': [
        `哼，又是一个外来者。我是${npc.name}，有话快说。`,
        `你来这里干什么？我是${npc.role}${npc.name}，警告你别惹麻烦。`
      ],
      '幽默': [
        `哟，来客人啦！我是${npc.name}，这里的${npc.role}兼气氛担当！`,
        `欢迎来到我的世界！我是${npc.name}，有什么能为你效劳的吗？`
      ],
      '严肃': [
        `我是${npc.name}，${npc.role}。请说明你的来意。`,
        `作为${npc.role}，我需要知道你的目的。`
      ]
    };
    
    // 获取适合NPC性格的问候语，默认为中立
    const npcGreetings = greetings[npc.personality] || greetings['中立'];
    // 随机选择一个问候语
    const initialGreeting = npcGreetings[Math.floor(Math.random() * npcGreetings.length)];
    
    // 添加初始问候语到对话
    setDialogMessages([
      { speaker: npc.name, text: initialGreeting }
    ]);
  };
  
  // 发送对话消息
  const sendMessage = () => {
    if (!userInput.trim() || !currentNPC) return;
    
    // 添加用户消息
    const newMessages = [...dialogMessages, { speaker: '你', text: userInput }];
    setDialogMessages(newMessages);
    setUserInput("");
    
    // 调用Coze API获取NPC回复
    setTimeout(async () => {
     try {
       // 随机选择一个语言模型，或根据NPC特点自动选择
        // 优先使用火山引擎豆包模型
        const reply = await callLanguageModel(currentNPC, userInput, 'volcano-doubao');
       setDialogMessages([...newMessages, { speaker: currentNPC.name, text: reply }]);
     } catch (error) {
       console.error('对话生成失败:', error);
       const replies = [
       `这个问题嘛...我不太确定。`,
       `抱歉，我没太听清楚你的问题。`,
       `关于这个，我知道的也不多。`,
       `也许你可以换个方式问我？`,
       `这个我得想想...`,
       `我不太确定，不过我可以帮你问问其他人。`,
       `这个问题有点复杂，不是一两句话能说清楚的。`,
       `说来话长，你确定想知道吗？`
     ];
     // 确保不重复最近使用的回复
     const recentReplies = dialogMessages
       .filter(m => m.speaker === currentNPC.name)
       .slice(-3)
       .map(m => m.text);
     const availableReplies = replies.filter(r => !recentReplies.includes(r));
     const randomReply = availableReplies.length > 0 
       ? availableReplies[Math.floor(Math.random() * availableReplies.length)]
       : replies[Math.floor(Math.random() * replies.length)];
        setDialogMessages([...newMessages, { speaker: currentNPC.name, text: randomReply }]);
      }
    }, 500);
  };
  
  // 处理场景元素点击
  const handleElementClick = (element: any) => {
    toast.info('你发现了一个线索！');
    setDialogMessages([
      ...dialogMessages,
      {
        speaker: '系统',
        text: '你找到了一个重要物品，这可能对解开谜题有帮助！'
      }
    ]);
  };
  
  return (
    <div className={cn("max-w-4xl mx-auto")}>
      <div className={cn("flex justify-between items-center mb-4")}>
        <button
          onClick={() => navigate('/editor')}
          className={cn("px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center")}
        >
          <i className="fa-solid fa-arrow-left mr-2"></i> 返回编辑
        </button>
        
        <h1 className={cn("text-2xl font-bold text-center flex-1")}>{game.title}</h1>
        
        <div className={cn("w-16")}></div> {/* 占位，保持居中 */}
      </div>
      
      {/* 游戏区域 */}
      <div className={cn("relative bg-gray-900 rounded-xl overflow-hidden aspect-video mb-4 border border-gray-700")}>
        {/* 场景背景 */}
          <img 
           src={game?.scenes && game.scenes[currentScene]?.background || `https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20scene%2C%20default%20background%2C%20adventure%20style&sign=49c7c613c840b96d5ac0aff91a6b71c7`} 
           alt="游戏场景"
           className={cn("w-full h-full object-cover")}
           onError={(e) => {
             e.target.src = `https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20scene%2C%20default%20background%2C%20adventure%20style&sign=49c7c613c840b96d5ac0aff91a6b71c7`;
           }}
         />
        
        {/* 互动元素 */}
        {game?.scenes && game.scenes[currentScene]?.elements.map((element: any) => (
          <div
            key={element.id}
            onClick={() => handleElementClick(element)}
            className={cn("absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110")}
            style={{ left: `${element.position.x}%`, top: `${element.position.y}%` }}
          >
            <div className={cn("w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center border-2 border-blue-400 animate-pulse")}>
              <i className="fa-solid fa-search text-blue-300"></i>
            </div>
          </div>
        ))}
        
         {/* NPC角色 */}
         {game?.scenes && game.scenes[currentScene]?.npcs.map((npc: any) => (
           <div
             key={npc.id}
             onClick={() => handleNPCInteraction(npc)}
             className={cn("absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110")}
             style={{ left: `${npc.position.x}%`, top: `${npc.position.y}%` }}
           >
             <div className={cn("flex flex-col items-center")}>
                 <div className={cn("bg-purple-500/30 rounded-full flex items-center justify-center border-2 border-purple-400 overflow-hidden")} style={{ width: `${npc.size / 6.25}%`, height: `${npc.size / 6.25}%` }}>
                  <img 
                    src={npc.avatar} 
                    alt={npc.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=game%20character%20default%20avatar&sign=5f52e2654d7170b9c396b47fcdbdc298';
                    }}
                  />
                </div>
               <div className={cn("bg-purple-600/90 text-white text-xs px-2 py-1 rounded mt-1 whitespace-nowrap")}>
                 {npc.name} <i className="fa-solid fa-comment-dots ml-1"></i>
               </div>
             </div>
           </div>
         ))}
         
         {/* 互动线索 */}
         {game?.scenes && game.scenes[currentScene]?.clues?.map((clue: any) => {
           if (!clue.collected) { // 如果线索未被收集才显示
             return (
               <div
                 key={clue.id}
                 onClick={() => handleClueClick(clue)} 
                 className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
                 style={{ left: `${clue.position.x}%`, top: `${clue.position.y}%` }}
               >
                 <div className="w-12 h-12 bg-yellow-500/90 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-lg">
                   <img 
                     src={clue.imageUrl} 
                     alt={clue.name}
                     className="w-8 h-8 object-contain"
                     onError={(e) => {
                       e.target.src = 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=question%20mark%2C%20icon&sign=1e1fb3e27100bb49a7c5313cbe6d911d';
                     }}
                   />
                 </div>
                 <div className="mt-1 bg-black/79 text-white text-xs px-4 py-1 rounded-full whitespace-nowrap">
                   {clue.name}
                 </div>
               </div>
             );
           }
           return null;
         })}
      </div>
      
      {/* 对话区域 */}
      <div className={cn("bg-gray-800 rounded-xl p-4 border border-gray-700")}>
        <div className={cn("h-48 overflow-y-auto mb-4 space-y-3 pr-2")}>
          {dialogMessages.map((msg, index) => (
            <div key={index} className={cn("flex gap-2")}>
              <div className={cn("w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0")}>
                {msg.speaker === '你' ? (
                  <i className="fa-solid fa-user text-blue-400"></i>
                ) : msg.speaker === '系统' ? (
                  <i className="fa-solid fa-robot text-gray-400"></i>
                ) : (
                  <i className="fa-solid fa-user-circle text-purple-400"></i>
                )}
              </div>
              <div>
                <div className={cn("font-medium text-sm")}>{msg.speaker}</div>
                <div className={cn("text-gray-300 text-sm")}>{msg.text}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 用户输入 */}
        <div className={cn("flex gap-2")}>
          <input
            type="text"
            placeholder="与NPC对话或探索场景..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className={cn("flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500")}
          />
          <button
            onClick={sendMessage}
            disabled={!userInput.trim()}
            className={cn("px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors")}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
           </div>
           
           {/* 下一场景按钮 */}
           {allCluesCollected && (
             <div className="mt-4 text-center">
               <button
                 onClick={() => {
                   if (currentScene < game.scenes.length - 1) {
                     setCurrentScene(currentScene + 1);
                     setAllCluesCollected(false);
                     setDialogMessages([{
                       speaker: '系统',
                       text: `进入新场景: ${game.scenes[currentScene + 1].name}`
                     }]);
                   } else {
                     toast.success('恭喜你完成了所有场景！游戏结束！');
                   }
                 }}
                 className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 transform hover:-translate-y-1"
               >
                 {currentScene < game.scenes.length - 1 ? (
                   <>
                     <i className="fa-solid fa-arrow-right mr-2"></i> 下一场景
                   </>
                 ) : (
                   <>
                     <i className="fa-solid fa-trophy mr-2"></i> 游戏完成
                   </>
                 )}
               </button>
             </div>
           )}
       </div>
      
      {/* 线索信息弹窗 */}
      {showClueInfo && currentClue && (
        <div className={cn("fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4")}>
          <div className={cn("bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto")}>
            <div className={cn("p-4 border-b border-gray-700 flex justify-between items-center")}>
              <h3 className={cn("text-xl font-bold")}>{currentClue.name}</h3>
              <button 
                onClick={() => setShowClueInfo(false)}
                className={cn("p-1 hover:bg-gray-700 rounded-full")}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className={cn("p-4")}>
              <div className={cn("mb-4 flex justify-center")}>
                <div className={cn("w-24 h-24 bg-yellow-900/40 rounded-full flex items-center justify-center")}>
                  <img 
                    src={currentClue.imageUrl} 
                    alt={currentClue.name}
                    className={cn("w-16 h-16 object-contain")}
                  />
                </div>
              </div>
              
              <p className={cn("text-gray-300 mb-4")}>{currentClue.description}</p>
              
              <div className={cn("bg-blue-900/30 border border-blue-800 rounded-lg p-4")}>
                <h4 className={cn("text-blue-400 font-semibold mb-2 flex items-center")}>
                  <i className="fa-solid fa-lightbulb mr-2"></i> {currentClue.name}相关知识
                </h4>
                <p className={cn("text-gray-300 text-sm leading-relaxed")}>{currentClue.knowledge}</p>
              </div>
            </div>
            
            <div className={cn("p-4 border-t border-gray-700 flex justify-end")}>
              <button 
                onClick={() => setShowClueInfo(false)}
                className={cn("px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors")}
              >
                关闭信息
              </button>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }