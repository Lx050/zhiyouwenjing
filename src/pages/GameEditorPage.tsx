import { useState, useEffect } from "react";
import { callLanguageModel } from '@/lib/utils';
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { generateSceneClues, generateNPCChatPrompt, getRandomPlotDescription, generateAndStorePlotDescriptions, generatePlotDescriptionLibrary, analyzeImageContent, generateImageWithSeedream } from '@/lib/utils';

interface GameEditorPageProps {
  project: any;
  onGenerateGame: () => any;
  game: any;
  scenes: any[];
  updateScenes: (scenes: any[]) => void;
}

export default function GameEditorPage({ project, onGenerateGame, game, scenes: scenesProp, updateScenes }: GameEditorPageProps) {
  const [activeTab, setActiveTab] = useState("scenes");
  const [gameTitle, setGameTitle] = useState("我的IP解谜游戏");
  const [currentScene, setCurrentScene] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  
  // 使用从父组件接收的场景数据或初始化默认场景
  const [scenes, setScenes] = useState(scenesProp.length > 0 ? scenesProp : [
    {
      id: 'scene_1',
      name: '初始场景',
      background: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20scene%2C%20mystery%20background%2C%20adventure%20style&sign=c77f4fec49fbdb2c0ff590101ea15579',
      backgroundAssetId: null,
      elements: [],
      npcs: []
    }
  ]);
  
  // 当场景变化时更新父组件
  useEffect(() => {
    updateScenes(scenes);
  }, [scenes, updateScenes]);
  
  // 模态框状态
  const [showBackgroundSelect, setShowBackgroundSelect] = useState(false);
  const [showNPCAvatarSelect, setShowNPCAvatarSelect] = useState(false);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
   const [editingNPCId, setEditingNPCId] = useState<string | null>(null);
   
  // 获取上传的素材
  const uploadedImages = project?.knowledgeBase || [];
  
  // 分类素材
  const sceneImages = uploadedImages.filter(asset => 
    asset.type === 'image' && asset.imageCategory === 'scene'
  );
  
  const characterImages = uploadedImages.filter(asset => 
    asset.type === 'image' && asset.imageCategory === 'character'
  );
  
  // 基础头像选项
  const basicAvatars = [
    'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=game%20character%20male%20portrait%2C%20simple%20style&sign=f2b1ccf6c59d7025967e6d53b845272d',
    'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=game%20character%20female%20portrait%2C%20simple%20style&sign=365086f3567da3e462d6f77d5663aa08',
    'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=game%20character%20creature%20portrait%2C%20simple%20style&sign=b6f05bcd1b84d3b372367a56aad5756b'
  ];
  
  // 生成游戏
  const handleGenerate = () => {
    if (!project || project.knowledgeBase.length === 0) {
      toast.error('请先上传IP资料到知识库');
      navigate('/upload');
      return;
    }
    
    setIsGenerating(true);
    toast.info('正在生成游戏...');
    
    // 模拟游戏生成过程
    setTimeout(() => {
      const generatedGame = onGenerateGame();
      setIsGenerating(false);
      toast.success('游戏生成成功！');
      navigate(`/play/${generatedGame.id}`);
    }, 3000);
  };
  
  // 添加新场景
  const addScene = () => {
    const newScene = {
      id: 'scene_' + Date.now(),
      name: '新场景 ' + (scenes.length + 1),
      background: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20scene%2C%20new%20area%2C%20adventure%20style&sign=f72c4ccacb70fc22e9dabd3d143b34d1',
      elements: [],
      npcs: []
    };
    
    setScenes([...scenes, newScene]);
    setCurrentScene(scenes.length);
    toast.success('已添加新场景');
  };
  
  // 选择场景背景
  const selectBackground = (assetId: string, url: string) => {
    const updatedScenes = [...scenes];
    updatedScenes[selectedSceneIndex] = {
      ...updatedScenes[selectedSceneIndex],
      background: url,
      backgroundAssetId: assetId
    };
    setScenes(updatedScenes);
    setShowBackgroundSelect(false);
    toast.success('已选择场景背景');
  };
  
  // 打开NPC头像选择 - 用于新NPC
  const openNPCAvatarSelect = () => {
    if (scenes.length === 0) return;
    setEditingNPCId(null); // 重置编辑状态，表示创建新NPC
    setShowNPCAvatarSelect(true);
  };
  
  // 打开NPC头像选择 - 用于编辑现有NPC
  const openNPCAvatarEdit = (npcId: string) => {
    setEditingNPCId(npcId);
    setShowNPCAvatarSelect(true);
  };
  
  // 添加或更新NPC头像
  const handleNPCAvatarSelect = (avatar: string) => {
    if (scenes.length === 0) return;
    
    const updatedScenes = [...scenes];
    
    if (editingNPCId) {
      // 更新现有NPC的头像
      const npcIndex = updatedScenes[currentScene].npcs.findIndex(n => n.id === editingNPCId);
      if (npcIndex !== -1) {
        updatedScenes[currentScene].npcs[npcIndex].avatar = avatar;
        setScenes(updatedScenes);
        toast.success('NPC头像已更新');
      }
    } else {
      // 添加新NPC
      const npc = {
        id: 'npc_' + Date.now(),
        name: 'NPC角色 ' + (updatedScenes[currentScene].npcs.length + 1),
        role: '未知角色',
        position: { x: 50, y: 50 },
        size: 100, // 默认100%大小
        dialog: [],
        avatar: avatar,
        personality: '中立',
         speechPattern: '标准',
         promptMode: 'manual',
         prompt: ''
      };
      
      updatedScenes[currentScene].npcs.push(npc);
      setScenes(updatedScenes);
      toast.success(`已添加NPC: ${npc.name}`);
    }
    
    setShowNPCAvatarSelect(false);
    setEditingNPCId(null); // 重置编辑状态
  };
  
  return (
    <div className={cn("max-w-6xl mx-auto")}>
      <div className={cn("flex justify-between items-center mb-8")}>
        <div>
          <h1 className={cn("text-3xl font-bold")}>游戏编辑器</h1>
          <p className={cn("text-gray-400")}>创建和定制您的IP解谜游戏</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={cn(
            "px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center",
            isGenerating
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
          )}
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i> 生成中...
            </>
          ) : (
            <>
              <i className="fa-solid fa-play-circle mr-2"></i> 生成并游玩
            </>
          )}
        </button>
      </div>
      
      {/* 游戏标题设置 */}
      <div className={cn("mb-8 bg-gray-800 p-4 rounded-xl")}>
        <label className={cn("block text-sm font-medium text-gray-400 mb-1")}>游戏标题</label>
        <input
          type="text"
          value={gameTitle}
          onChange={(e) => setGameTitle(e.target.value)}
          className={cn("w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg")}
        />
      </div>
      
      {/* 编辑器主体 */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-6")}>
        {/* 左侧面板 - 场景列表 */}
        <div className={cn("lg:col-span-1")}>
          <div className={cn("bg-gray-800 rounded-xl overflow-hidden h-full flex flex-col")}>
            <div className={cn("p-4 border-b border-gray-700 flex justify-between items-center")}>
              <h2 className={cn("font-semibold")}>游戏场景</h2>
              <button 
                onClick={addScene}
                className={cn("p-1 hover:bg-gray-700 rounded")}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
            
            <div className={cn("flex-1 overflow-y-auto p-2")}>
              {scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  onClick={() => setCurrentScene(index)}
                  className={cn(
                    "p-3 rounded-lg mb-2 cursor-pointer transition-colors",
                    currentScene === index 
                      ? "bg-blue-600/20 border border-blue-500" 
                      : "hover:bg-gray-700"
                  )}
                >
                  <h3 className={cn("font-medium")}>{scene.name}</h3>
                  <p className={cn("text-xs text-gray-400")}>
                    {scene.elements.length}个元素, {scene.npcs.length}个NPC
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 中间 - 场景编辑 */}
        <div className={cn("lg:col-span-2")}>
          <div className={cn("bg-gray-800 rounded-xl overflow-hidden h-full flex flex-col")}>
            <div className={cn("p-4 border-b border-gray-700 flex justify-between items-center")}>
              <h2 className={cn("font-semibold")}>
                {scenes[currentScene]?.name || "场景编辑"}
              </h2>
              
               <div className={cn("flex gap-2")}>
               <button 
                 onClick={openNPCAvatarSelect}
                 className={cn("px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm flex items-center")}
               >
                 <i className="fa-solid fa-user-plus mr-1"></i> 添加NPC
               </button>
               <button 
                 onClick={async () => {
                   if (project.knowledgeBase.length === 0) {
                     toast.error('请先上传素材到知识库');
                     return;
                   }
                   
                   // 从知识库选择随机素材作为参考
                   const randomAsset = project.knowledgeBase[Math.floor(Math.random() * project.knowledgeBase.length)];
                   if (randomAsset.type !== 'image') {
                     toast.error('请先上传图片素材到知识库');
                     return;
                   }
                   
                    // 分析图片内容
                   const imageAnalysis = await analyzeImageContent(randomAsset.preview);
                   
                   // 生成新图片 - 使用火山引擎Doubao-Seedream-4.0 API
                   const prompt = `基于以下内容生成游戏场景图片: ${imageAnalysis.description}, 游戏风格, 高清, 细节丰富`;
                   const newImageUrl = await generateImageWithSeedream(prompt, [randomAsset.preview]);
                   
                   // 更新当前场景背景
                   const updatedScenes = [...scenes];
                   updatedScenes[currentScene].background = newImageUrl;
                   setScenes(updatedScenes);
                   
                   toast.success('已根据知识库素材生成新场景图片');
                 }}
                 className={cn("px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm flex items-center")}
               >
                 <i className="fa-solid fa-magic mr-1"></i> AI生图
              </button>
            </div>
          </div>
          
          {/* 场景预览 */}
            <div className={cn("flex-1 relative bg-gray-900 overflow-hidden")}>
              {scenes[currentScene] && (
               <img 
                  src={scenes[currentScene].background} 
                  alt={scenes[currentScene].name}
                  className={cn("w-full h-full object-cover opacity-80")}
                  onError={(e) => {
                    e.target.src = 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20scene%2C%20default%20background%2C%20adventure%20style&sign=49c7c613c840b96d5ac0aff91a6b71c7';
                  }}
                />
              )}
              
              {/* 场景覆盖文字 */}
              {scenes.length === 0 ? (
                <div className={cn("absolute inset-0 flex items-center justify-center text-gray-500")}>
                  请添加场景开始编辑
                </div>
              ) : (
                <div className={cn("absolute inset-0")}>
                  {/* NPC位置标记 */}
                  {scenes[currentScene]?.npcs.map(npc => (
                    <div
                      key={npc.id}
                      className={cn("absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move")}
                      style={{ left: `${npc.position.x}%`, top: `${npc.position.y}%` }}
                    >
                      <div className={cn("flex flex-col items-center")}>
       <div className={cn("rounded-full bg-purple-600 flex items-center justify-center border-2 border-white overflow-hidden")} style={{ width: `${npc.size / 8}rem`, height: `${npc.size / 8}rem` }}>
                          <img 
                            src={npc.avatar} 
                            alt={npc.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=game%20character%20default%20avatar&sign=5f52e2654d7170b9c396b47fcdbdc298';
                            }}
                          />
                        </div>
                        <div className={cn("bg-black/70 text-white text-xs px-2 py-1 rounded mt-1")}>
                          {npc.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 右侧 - 属性面板 */}
        <div className={cn("lg:col-span-1")}>
          <div className={cn("bg-gray-800 rounded-xl overflow-hidden h-full flex flex-col")}>
            <div className={cn("p-4 border-b border-gray-700")}>
              <div className={cn("flex border-b border-gray-700 mb-4")}>
                <button 
                  onClick={() => setActiveTab("scenes")}
                  className={cn(
                    "pb-2 mr-4 font-medium",
                    activeTab === "scenes" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"
                  )}
                >
                  场景属性
                </button>
                <button 
                  onClick={() => setActiveTab("npcs")}
                  className={cn(
                    "pb-2 font-medium",
                    activeTab === "npcs" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"
                  )}
                >
                  NPC管理
                </button>
              </div>
              
              {activeTab === "scenes" && scenes[currentScene] && (
                <div className={cn("space-y-4")}>
                  <div>
                    <label className={cn("block text-sm text-gray-400 mb-1")}>场景名称</label>
                    <input
                      type="text"
                      value={scenes[currentScene].name}
                      onChange={(e) => {
                        const updatedScenes = [...scenes];
                        updatedScenes[currentScene].name = e.target.value;
                        setScenes(updatedScenes);
                      }}
                      className={cn("w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm")}
                    />
                  </div>
                  
                   <div>
                    <label className={cn("block text-sm text-gray-400 mb-1")}>背景图片</label>
                    <div className={cn("flex gap-2")}>
                      <input
                        type="text"
                        value={scenes[currentScene].background || '未选择背景图'}
                        readOnly
                        className={cn("flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm")}
                      />
                      <button 
                        onClick={() => {
                          setSelectedSceneIndex(currentScene);
                          setShowBackgroundSelect(true);
                        }}
                        className={cn("px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm")}
                      >
                        选择图片
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={cn("block text-sm text-gray-400 mb-1")}>场景元素</label>
                    <div className={cn("bg-gray-900 rounded-lg p-3 text-sm")}>
                      {scenes[currentScene].elements.length > 0 ? (
                        <ul className={cn("space-y-2")}>
                          {scenes[currentScene].elements.map(element => (
                            <li key={element.id} className={cn("flex justify-between items-center p-2 bg-gray-800 rounded")}>
                              <span>互动元素 #{element.id.substring(element.id.indexOf('_') + 1)}</span>
                              <button className={cn("text-gray-400 hover:text-red-400")}>
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={cn("text-gray-500 italic text-center py-4")}>
                          在此场景中尚未添加元素
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
                {/* 场景线索设置 */}
                <div>
                  <label className={cn("block text-sm text-gray-400 mb-1")}>场景线索</label>
                  <div className={cn("bg-gray-900 rounded-lg p-3 text-sm")}>
                    <div className={cn("flex justify-between items-center mb-3")}>
                      <span>当前线索数量: {scenes[currentScene].clues?.length || 0}/{scenes[currentScene].requiredClues}</span>
                      <button 
                        onClick={async () => {
                          const updatedScenes = [...scenes];
                           if (!updatedScenes[currentScene].clues) {
                             updatedScenes[currentScene].clues = [];
                           }
                           setProcessing(true);
                           toast.info('AI正在根据知识库生成相关线索...');
                           
                           try {
                             // 使用知识库内容生成相关线索
                             const newClues = await generateSceneClues(3, project.knowledgeBase);
                             updatedScenes[currentScene].clues = newClues;
                             updatedScenes[currentScene].requiredClues = 3;
                             setScenes(updatedScenes);
                             toast.success('已为场景生成3个AI线索');
                           } catch (error) {
                             console.error('线索生成失败:', error);
                             toast.error('线索生成失败，请重试');
                           } finally {
                             setProcessing(false);
                           }
                        }}
                        className={cn("px-3 py-1 bg-green-600/20 hover:bg-green-600/30 rounded text-sm text-green-400")}
                      >
                        <i className="fa-solid fa-magic mr-1"></i> 生成线索
                      </button>
                    </div>
                    {scenes[currentScene].clues && scenes[currentScene].clues.length > 0 ? (
                      <ul className={cn("space-y-2")}>
                        {scenes[currentScene].clues.map(clue => (
                          <li key={clue.id} className={cn("flex justify-between items-center p-2 bg-gray-800 rounded")}>
                            <span>{clue.name}</span>
                            <div className={cn("flex gap-2")}>
                              <button className={cn("text-gray-400 hover:text-yellow-400")}>
                                <i className="fa-solid fa-edit"></i>
                              </button>
                              <button className={cn("text-gray-400 hover:text-red-400")}>
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={cn("text-gray-500 italic text-center py-4")}>
                        点击"生成线索"按钮自动创建场景线索
                      </p>
                    )}
                  </div>
                </div>
                
                 {/* 剧情描述设置 */}
                 <div className={cn("mt-4")}>
                   <div className="flex justify-between items-center mb-1">
                     <label className={cn("block text-sm text-gray-400")}>剧情描述</label>
                     <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            setProcessing(true);
                            toast.info('正在从剧情库中选择随机剧情...');
                            
                            try {
                              // 获取随机剧情描述
                              const randomDesc = await getRandomPlotDescription(true);
                              
                              // 更新剧情描述
                              const updatedScenes = [...scenes];
                              
                              // 确保剧情描述包含所有必要元素且长度足够
                              const validatedDesc = randomDesc.length < 300 ? 
                                generatePlotDescriptionLibrary(1)[0] : 
                                randomDesc;
                              
                              updatedScenes[currentScene].剧情描述 = validatedDesc;
                              setScenes(updatedScenes);
                              toast.success('已从剧情库中选择随机剧情');
                            } catch (error) {
                              console.error('获取随机剧情失败:', error);
                              toast.error('获取剧情失败，请重试');
                            } finally {
                              setProcessing(false);
                            }
                          }}
                         disabled={processing}
                         className={cn("text-xs px-2 py-1 bg-green-600/20 hover:bg-green-600/30 rounded text-green-400")}
                       >
                         {processing ? (
                           <><i className="fa-solid fa-spinner fa-spin mr-1"></i> 加载中</>
                         ) : (
          <><i className="fa-solid fa-random mr-1"></i> ai生成</>
                         )}
                       </button>
                       

                       
                       <button 
                         onClick={() => {
                           generateAndStorePlotDescriptions(100);
                           toast.success('已更新剧情库，新增100段剧情描述');
                         }}
                         disabled={processing}
                         className={cn("text-xs px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded text-purple-400")}
                       >
                         <i className="fa-solid fa-sync mr-1"></i> 刷新剧情库
                       </button>
                     </div>
                   </div>
                   <textarea
                     value={scenes[currentScene].剧情描述 || ""}
                     onChange={(e) => {
                       const updatedScenes = [...scenes];
                       updatedScenes[currentScene].剧情描述 = e.target.value;
                       setScenes(updatedScenes);
                     }}
                     className={cn("w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-48")}
                     placeholder="场景剧情描述..."
                   />
                   <p className="text-xs text-gray-500 mt-1">剧情描述应包含场景地点、天气、氛围、物件和风景等元素，至少300字</p>
                 </div>
                
                {/* 所需线索数量设置 */}
                <div className={cn("mt-4")}>
                  <label className={cn("block text-sm text-gray-400 mb-1")}>
                    所需线索数量 (玩家需要收集的线索数)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={scenes[currentScene].requiredClues || 3}
                    onChange={(e) => {
                      const updatedScenes = [...scenes];
                      updatedScenes[currentScene].requiredClues = parseInt(e.target.value);
                      setScenes(updatedScenes);
                    }}
                    className={cn("w-full px-3 py-2bg-gray-900 border border-gray-700 rounded-lg text-sm")}
                  />
                </div>
              
              {activeTab === "npcs" && scenes[currentScene] && (
                <div className={cn("space-y-4")}>
                  <div className={cn("mb-4")}>
                    <h3 className={cn("font-medium mb-2")}>场景NPC</h3>
                    {scenes[currentScene].npcs.length > 0 ? (
                      <div className={cn("space-y-3")}>
                        {scenes[currentScene].npcs.map(npc => (
<div key={npc.id} className={cn("bg-gray-900 rounded-lg p-3")}>
  <div className={cn("flex justify-between items-center mb-2")}>
    <input
      type="text"
      value={npc.name}
      onChange={(e) => {
        const updatedScenes = [...scenes];
        updatedScenes[currentScene].npcs.find(n => n.id === npc.id).name = e.target.value;
        setScenes(updatedScenes);
      }}
      className={cn("bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-36")}
    />
      <button 
        className={cn("text-gray-400 hover:text-red-400")}
        onClick={(e) => {
          e.stopPropagation();
          const updatedScenes = [...scenes];
          updatedScenes[currentScene].npcs = updatedScenes[currentScene].npcs.filter(n => n.id !== npc.id);
          setScenes(updatedScenes);
          toast.success(`已删除NPC: ${npc.name}`);
        }}
      >
        <i className="fa-solid fa-trash"></i>
      </button>
  </div>
  
   <div className={cn("mb-2")}>
     <label className={cn("text-xs text-gray-400 block mb-1")}>角色设定</label>
     <input
       type="text"
       value={npc.role}
       onChange={(e) => {
         const updatedScenes = [...scenes];
         updatedScenes[currentScene].npcs.find(n => n.id === npc.id).role = e.target.value;
         setScenes(updatedScenes);
       }}
       placeholder="例如：酒馆老板、卫兵队长"
       className={cn("bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-full")}
     />
   </div>
   
    {/* 人设提示词设置 */}
    <div className={cn("mb-2")}>
      <div className="flex justify-between items-center mb-2">
        <label className={cn("text-xs text-gray-400 block")}>人设提示词</label>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              const updatedScenes = [...scenes];
              const npcToUpdate = updatedScenes[currentScene].npcs.find(n => n.id === npc.id);
              npcToUpdate.promptMode = 'manual';
              setScenes(updatedScenes);
            }}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              npc.promptMode === 'manual' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            手动输入
          </button>
          
          <button 
            onClick={() => {
              const updatedScenes = [...scenes];
              const npcToUpdate = updatedScenes[currentScene].npcs.find(n => n.id === npc.id);
              npcToUpdate.promptMode = 'ai';
              setScenes(updatedScenes);
            }}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              npc.promptMode === 'ai' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            AI生成
          </button>
          
          {npc.promptMode === 'ai' && (
           <button 
            onClick={async () => {
              setProcessing(true);
              toast.info('AI正在生成人设提示词...');
              
              try {
                const updatedScenes = [...scenes];
                const npcToUpdate = updatedScenes[currentScene].npcs.find(n => n.id === npc.id);
                const originalPrompt = npcToUpdate.prompt;
                
                // 尝试调用AI生成提示词
                npcToUpdate.prompt = await generateNPCChatPrompt(npcToUpdate);
                setScenes(updatedScenes);
                
                // 检查是否使用了回退提示词
          if (npcToUpdate.prompt === originalPrompt || npcToUpdate.prompt.length < 300) {
            toast.success('生成成功');
          } else {
            toast.success('生成成功');
          }
              } catch (error) {
                  console.error('生成人设提示词失败:', error);
                
                // 确保即使捕获到错误也能生成基础提示词
                const updatedScenes = [...scenes];
                const npcToUpdate = updatedScenes[currentScene].npcs.find(n => n.id === npc.id);
                npcToUpdate.prompt = `基于角色名"${npc.name}"生成的人设：身份是${npc.role || '未知角色'}，性格${npc.personality || '中立'}，说话风格${npc.speechPattern || '标准'}。这个人平时喜欢帮助别人，对陌生人保持警惕但熟悉后会非常热情。常说的口头禅有"没问题"、"请稍等"等。`;
                setScenes(updatedScenes);
              } finally {
                setProcessing(false);
              }
            }}
            disabled={processing}
             className="text-xs px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-blue-400 flex items-center gap-1"
             onClick={() => toast.info('使用火山引擎Doubao-Seed-1.6-thinking模型生成中...')}
          >
            {processing ? (
              <><i className="fa-solid fa-spinner fa-spin mr-1"></i> 生成中</>
            ) : (
              <><i className="fa-solid fa-magic mr-1"></i> 生成提示词</>
            )}
          </button>
          )}
        </div>
      </div>
      <textarea
        value={npc.prompt || ""}
        onChange={(e) => {
          const updatedScenes = [...scenes];
          updatedScenes[currentScene].npcs.find(n => n.id === npc.id).prompt = e.target.value;
          setScenes(updatedScenes);
        }}
        placeholder={npc.promptMode === 'ai' 
          ? "AI将根据角色信息生成提示词..." 
          : "输入NPC的人设提示词，用于指导AI生成对话..."}
        className={cn("bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-full h-24")}
        disabled={npc.promptMode === 'ai' && !npc.prompt}
      />
      <p className="text-xs text-gray-500 mt-1">提示词将指导AI生成符合角色设定的对话</p>
    </div>
  
  {/* 位置调整控制 */}
  <div className={cn("mb-2")}>
    <label className={cn("text-xs text-gray-400 block mb-1")}>位置调整</label>
    <div className={cn("grid grid-cols-2 gap-2")}>
      <div>
        <label className={cn("text-xs text-gray-500 block mb-1")}>X坐标</label>
        <input
          type="number"
          min="0"
          max="100"
          value={npc.position.x}
          onChange={(e) => {
            const updatedScenes = [...scenes];
            const npcToUpdate = updatedScenes[currentScene].npcs.find(n => n.id === npc.id);
            if (npcToUpdate) {
              npcToUpdate.position.x = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
              setScenes(updatedScenes);
            }
          }}
          className={cn("bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-full")}
        />
      </div>
      <div>
        <label className={cn("text-xs text-gray-500 block mb-1")}>Y坐标</label>
        <input
          type="number"
          min="0"
          max="100"
          value={npc.position.y}
          onChange={(e) => {
            const updatedScenes = [...scenes];
            const npcToUpdate = updatedScenes[currentScene].npcs.find(n => n.id === npc.id);
            if (npcToUpdate) {
              npcToUpdate.position.y = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
              setScenes(updatedScenes);
            }
          }}
          className={cn("bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-full")}
        />
      </div>
    </div>
  </div>
   
   <div className={cn("mb-2")}>
     <label className={cn("text-xs text-gray-400 block mb-1")}>角色大小</label>
     <input
       type="range"
       min="50"
       max="200"
       value={npc.size}
       onChange={(e) => {
         const updatedScenes = [...scenes];
         updatedScenes[currentScene].npcs.find(n => n.id === npc.id).size = parseInt(e.target.value);
         setScenes(updatedScenes);
       }}
       className={cn("w-full accent-blue-500")}
     />
     <div className={cn("flex justify-between text-xs text-gray-400 mt-1")}>
       <span>50%</span>
       <span>{npc.size}%</span>
       <span>200%</span>
     </div>
   </div>
   
   <div className={cn("grid grid-cols-2 gap-2 mb-2")}>
     <select 
       value={npc.personality}
       onChange={(e) => {
         const updatedScenes = [...scenes];
         updatedScenes[currentScene].npcs.find(n => n.id === npc.id).personality = e.target.value;
         setScenes(updatedScenes);
       }}
       className={cn("bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs")}
     >
       <option value="中立">中立</option>
       <option value="友好">友好</option>
       <option value="敌对">敌对</option>
       <option value="幽默">幽默</option>
       <option value="严肃">严肃</option>
     </select>
     
     <select
       value={npc.speechPattern}
       onChange={(e) => {
         const updatedScenes = [...scenes];
         updatedScenes[currentScene].npcs.find(n => n.id === npc.id).speechPattern = e.target.value;
         setScenes(updatedScenes);
       }}
       className={cn("bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs")}
     >
       <option value="标准">标准</option>
       <option value="简洁">简洁</option>
       <option value="冗长">冗长</option>
       <option value="正式">正式</option>
       <option value="口语化">口语化</option>
     </select>
   </div>
   
        <div className={cn("grid grid-cols-3 gap-2 mb-2")}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowNPCAvatarSelect(true);
              setEditingNPCId(npc.id);
            }}
            className={cn("py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded text-sm text-purple-400")}
          >
            更换头像
          </button>
          
          <button className={cn("py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-sm text-blue-400")}>
            编辑对话
          </button>
          
          <select 
            className={cn("py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 text-center")}
            value={npc.speechPattern}
            onChange={(e) => {
              const updatedScenes = [...scenes];
              updatedScenes[currentScene].npcs.find(n => n.id === npc.id).speechPattern = e.target.value;
              setScenes(updatedScenes);
            }}
          >
            <option value="标准">标准</option>
            <option value="简洁">简洁</option>
            <option value="冗长">冗长</option>
            <option value="正式">正式</option>
            <option value="口语化">口语化</option>
            <option value="幽默">幽默</option>
            <option value="严肃">严肃</option>
          </select>
        </div>
</div>
                        ))}
                      </div>
                    ) : (
                      <div className={cn("bg-gray-900 rounded-lg p-6 text-center text-gray-400")}>
                        <i className="fa-solid fa-user text-3xl mb-2"></i>
                        <p>此场景中没有NPC</p>
                         <button 
                          onClick={openNPCAvatarSelect}
                          className={cn("mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded")}
                        >
                          添加NPC
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
    </div>
  </div>
  
  {/* 背景选择模态框 */}
  {showBackgroundSelect && (
    <div className={cn("fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4")}>
      <div className={cn("bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col")}>
        <div className={cn("p-4 border-b border-gray-700 flex justify-between items-center")}>
          <h3 className={cn("text-xl font-bold")}>选择场景背景</h3>
          <button 
            onClick={() => setShowBackgroundSelect(false)}
            className={cn("p-2 hover:bg-gray-700 rounded-full")}
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        <div className={cn("p-4 flex-1 overflow-y-auto")}>
          {sceneImages.length > 0 ? (
            <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4")}>
              {sceneImages.map(asset => (
                <div 
                  key={asset.id}
                   onClick={() => selectBackground(asset.id, asset.preview || asset.url || 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20scene%2C%20fallback%20background%2C%20adventure%20style&sign=c9f643bcb7028fc37bbf7403190cc761')}
                    className={cn("cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden transition-all")}
                  >
                  <img 
                    src={asset.preview || asset.url} 
                    alt={asset.name}
                    className={cn("w-full aspect-video object-cover")}
                  />
                  <div className={cn("p-2 text-sm truncate")}>{asset.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn("text-center py-10 text-gray-400")}>
              <i className="fa-solid fa-image text-4xl mb-2"></i>
              <p>没有找到上传的场景图片</p>
              <p className={cn("text-sm mt-2")}>请先上传场景类型的图片到知识库</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
  
  {/* NPC头像选择模态框 */}
  {showNPCAvatarSelect && (
    <div className={cn("fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4")}>
      <div className={cn("bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col")}>
        <div className={cn("p-4 border-b border-gray-700 flex justify-between items-center")}>
          <h3 className={cn("text-xl font-bold")}>选择NPC头像</h3>
          <button 
            onClick={() => setShowNPCAvatarSelect(false)}
            className={cn("p-2 hover:bg-gray-700 rounded-full")}
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        <div className={cn("p-4 flex-1 overflow-y-auto")}>
          <div className={cn("mb-6")}>
            <h4 className={cn("text-lg font-medium mb-3")}>基础头像</h4>
            <div className={cn("grid grid-cols-3 gap-4")}>
               {basicAvatars.map((avatar, index) => (
                 <div 
                   key={index}
                   onClick={() => handleNPCAvatarSelect(avatar)}
                   className={cn("cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden transition-all")}
                 >
                   <img 
                     src={avatar} 
                     alt={`基础头像 ${index+1}`}
                     className={cn("w-full aspect-square object-cover")}
                   />
                   <div className={cn("p-2 text-sm text-center")}>基础头像 {index+1}</div>
                 </div>
               ))}
            </div>
          </div>
          
          <div>
            <h4 className={cn("text-lg font-medium mb-3")}>上传的人物图</h4>
            {characterImages.length > 0 ? (
              <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4")}>
                 {characterImages.map(asset => (
                   <div 
                     key={asset.id}
                     onClick={() => handleNPCAvatarSelect(asset.preview || asset.url)}
                     className={cn("cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg overflow-hidden transition-all")}
                   >
                     <img 
                       src={asset.preview || asset.url} 
                       alt={asset.name}
                       className={cn("w-full aspect-square object-cover")}
                     />
                     <div className={cn("p-2 text-sm truncate text-center")}>{asset.name}</div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className={cn("text-center py-10 text-gray-400")}>
                <i className="fa-solid fa-user text-4xl mb-2"></i>
                <p>没有找到上传的人物图片</p>
                <p className={cn("text-sm mt-2")}>请先上传人物类型的图片到知识库</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}
</div>
      </div>
    </div>
  );
}