import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// 项目接口定义
interface Project {
  id: string;
  name: string;
  knowledgeBase: any[];
  createdAt: Date;
}

interface KnowledgeBasePageProps {
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
  createNewProject: (name: string) => void;
  updateProjectName: (projectId: string, newName: string) => void;
  deleteProject: (projectId: string) => void;
  removeAssetFromKnowledgeBase: (assetId: string) => void;
}

export default function KnowledgeBasePage({ 
  projects, 
  activeProjectId, 
  setActiveProjectId,
  updateProjectName,
  createNewProject,
  deleteProject,
  removeAssetFromKnowledgeBase
}: KnowledgeBasePageProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editProjectName, setEditProjectName] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();
  
  // 获取当前激活的项目
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  
  // 当激活项目变化时更新状态
  useEffect(() => {
    if (activeProject) {
      setNewProjectName(activeProject.name);
    }
  }, [activeProject]);
  
  // 获取当前项目的资产
  const currentAssets = activeProject?.knowledgeBase || [];
  
  // 获取所有可用分类
  const allCategories = ["all", "视觉素材", "视频素材", "文本资料", "其他素材"];
  
  // 过滤资产
  const filteredAssets = currentAssets.filter(asset => {
    const matchesCategory = activeCategory === "all" || asset.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
                          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (asset.tags && asset.tags.some((tag: string) => 
                            tag.toLowerCase().includes(searchQuery.toLowerCase())
                          ));
    return matchesCategory && matchesSearch;
  });
  
  // 处理项目名称编辑
  const handleProjectNameEdit = () => {
    if (!activeProjectId) return;
    
    if (editProjectName) {
      // 保存名称
      updateProjectName(activeProjectId, newProjectName);
    }
    
    setEditProjectName(!editProjectName);
  };
  
  // 生成游戏
  const handleGenerateGame = () => {
    if (!activeProject || currentAssets.length === 0) {
      toast.error('请先为当前项目添加知识库内容');
      navigate('/upload');
      return;
    }
    
    toast.info('正在跳转到游戏编辑器...');
    navigate('/editor');
  };
  
  return (
    <div className={cn("max-w-6xl mx-auto")}>
      {/* 项目管理区域 */}
      <div className={cn("mb-8 bg-gray-800 rounded-xl p-6")}>
        <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6")}>
          <div className={cn("flex items-center gap-4 flex-1")}>
            <h1 className={cn("text-2xl font-bold")}>知识库管理</h1>
            
            {/* 项目选择器 */}
            <div className={cn("relative flex-1 max-w-md")}>
              <select
                value={activeProjectId || ""}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className={cn("w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500")}
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <div className={cn("absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400")}>
                <i className="fa-solid fa-chevron-down"></i>
              </div>
            </div>
          </div>
          
           <div className={cn("flex gap-3")}>
              <button
                onClick={() => setShowCreateDialog(true)}
                className={cn("px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors")}
              >
                <i className="fa-solid fa-plus mr-1"></i> 新建知识库
              </button>
              
              <button
                onClick={() => {
                  if (activeProjectId && window.confirm('确定要删除当前知识库吗？此操作不可恢复。')) {
                    deleteProject(activeProjectId);
                  }
                }}
                className={cn("px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors")}
              >
                <i className="fa-solid fa-trash mr-1"></i> 删除知识库
              </button>
              
              <div className={cn("flex items-center border border-gray-700 rounded-lg overflow-hidden")}>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleProjectNameEdit()}
                  disabled={!editProjectName}
                  className={cn("bg-transparent px-3 py-2 focus:outline-none w-48")}
                />
                <button
                  onClick={handleProjectNameEdit}
                  className={cn("p-2 bg-gray-700 hover:bg-gray-600 transition-colors")}
                >
                  {editProjectName ? (
                    <i className="fa-solid fa-check text-green-400"></i>
                  ) : (
                    <i className="fa-solid fa-pencil text-gray-300"></i>
                  )}
                </button>
              </div>
              
              <button
                onClick={() => navigate('/upload')}
                className={cn("px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors")}
              >
                <i className="fa-solid fa-upload mr-1"></i> 上传资料
              </button>
            </div>
            
            {/* 新建知识库对话框 */}
            {showCreateDialog && (
              <div className={cn("fixed inset-0 bg-black/50 flex items-center justify-center z-50")}>
                <div className={cn("bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4")}>
                  <h3 className={cn("text-xl font-bold mb-4")}>新建知识库</h3>
                  <div className={cn("mb-4")}>
                    <label className={cn("block text-sm text-gray-400 mb-1")}>知识库名称</label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className={cn("w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500")}
                      placeholder="输入知识库名称"
                      autoFocus
                    />
                  </div>
                  <div className={cn("flex gap-3 justify-end")}>
                    <button
                      onClick={() => setShowCreateDialog(false)}
                      className={cn("px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors")}
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        if (newProjectName.trim()) {
                          createNewProject(newProjectName);
                          setShowCreateDialog(false);
                          setNewProjectName("");
                        }
                      }}
                      className={cn("px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors")}
                    >
                      创建
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
        
        {/* 项目统计信息 */}
        <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-4 text-center")}>
          <div className={cn("bg-gray-900/50 rounded-lg p-4")}>
            <div className={cn("text-3xl font-bold text-blue-400 mb-1")}>{currentAssets.length}</div>
            <div className={cn("text-gray-400 text-sm")}>总资产数</div>
          </div>
          <div className={cn("bg-gray-900/50 rounded-lg p-4")}>
            <div className={cn("text-3xl font-bold text-green-400 mb-1")}>
              {currentAssets.filter(a => a.type === 'image').length}
            </div>
            <div className={cn("text-gray-400 text-sm")}>图片素材</div>
          </div>
          <div className={cn("bg-gray-900/50 rounded-lg p-4")}>
            <div className={cn("text-3xl font-bold text-purple-400 mb-1")}>
              {currentAssets.filter(a => a.type === 'video').length}
            </div>
            <div className={cn("text-gray-400 text-sm")}>视频素材</div>
          </div>
          <div className={cn("bg-gray-900/50 rounded-lg p-4")}>
            <div className={cn("text-3xl font-bold text-yellow-400 mb-1")}>
              {currentAssets.filter(a => a.type === 'text').length}
            </div>
            <div className={cn("text-gray-400 text-sm")}>文本素材</div>
          </div>
        </div>
      </div>
      
      {/* 搜索和分类筛选 */}
      <div className={cn("mb-8 flex flex-col md:flex-row gap-4")}>
        <div className={cn("flex-1 relative")}>
          <input
            type="text"
            placeholder="搜索知识库中的资产..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500")}
          />
          <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
        
        <div className={cn("flex flex-wrap gap-2")}>
          {allCategories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-colors",
                activeCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* 知识库为空状态 */}
      {currentAssets.length === 0 ? (
        <div className={cn("text-center py-16 bg-gray-800/50 rounded-xl")}>
          <div className={cn("text-5xl mb-4 text-gray-500")}>
            <i className="fa-solid fa-box-open"></i>
          </div>
          <h3 className={cn("text-xl font-medium mb-2")}>当前项目知识库为空</h3>
          <p className={cn("text-gray-400 mb-6")}>上传IP资料并处理后，资产将显示在这里</p>
          <button
            onClick={() => navigate('/upload')}
            className={cn("px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors")}
          >
            去上传资料
          </button>
        </div>
      ) : (
        // 资产网格
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6")}>
          {filteredAssets.map(asset => (
            <motion.div
              key={asset.id}
              className={cn("bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 资产预览 */}
              <div className={cn("h-48 bg-gray-900 flex items-center justify-center relative")}>
                <button 
                  onClick={() => removeAssetFromKnowledgeBase(asset.id)}
                   className={cn("absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full opacity-100 transition-all")}
                >
                   <i className="fa-solid fa-trash"></i>
                   <span className="ml-1">删除</span>
                </button>
                
                {asset.type === 'image' && asset.preview && (
                  <img 
                    src={asset.preview} 
                    alt={asset.name}
                    className={cn("w-full h-full object-cover")}
                  />
                )}
                {asset.type === 'video' && (
                  <div className={cn("text-center p-4")}>
                    <i className="fa-solid fa-video text-5xl text-purple-400 mb-2"></i>
                    <p className={cn("text-gray-400")}>视频素材</p>
                  </div>
                )}
                {asset.type === 'text' && (
                  <div className={cn("text-center p-4")}>
                    <i className="fa-solid fa-file-text text-5xl text-blue-400 mb-2"></i>
                    <p className={cn("text-gray-400")}>文本资料</p>
                  </div>
                )}
              </div>
              
              {/* 资产信息 */}
              <div className={cn("p-4")}>
                <div className={cn("flex justify-between items-start mb-2")}>
                  <h3 className={cn("font-semibold text-lg truncate")}>{asset.name}</h3>
                  <span className={cn("px-2 py-1 bg-gray-700 text-xs rounded-full")}>{asset.size}</span>
                </div>
                
                <p className={cn("text-gray-400 text-sm mb-3")}>
                  {asset.category}
                  {asset.imageCategory && (
                    <span className={cn("ml-2 text-xs bg-gray-700 px-1.5 py-0.5 rounded")}>
                      {asset.imageCategory === 'character' ? '人物图' : 
                       asset.imageCategory === 'scene' ? '场景图' : '道具图'}
                    </span>
                  )}
                </p>
                
                {/* 标签 */}
                <div className={cn("flex flex-wrap gap-1")}>
                  {asset.tags?.map((tag: string, index: number) => (
                    <span 
                      key={index}
                      className={cn("px-2 py-0.5 bg-gray-700 text-xs rounded-full")}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* 生成游戏按钮 */}
      {currentAssets.length > 0 && (
        <div className={cn("mt-10 text-center")}>
          <button
            onClick={handleGenerateGame}
            className={cn("px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg transition-all duration-300 flex items-center mx-auto")}
          >
            <i className="fa-solid fa-gamepad mr-2"></i> 根据当前知识库生成游戏
          </button>
        </div>
      )}
    </div>
  );
}