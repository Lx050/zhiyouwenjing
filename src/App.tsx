import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthContext } from '@/contexts/authContext';
import Home from "@/pages/Home";
import UploadPage from "@/pages/UploadPage";
import KnowledgeBasePage from "@/pages/KnowledgeBasePage";
import GameEditorPage from "@/pages/GameEditorPage";
import GamePlayPage from "@/pages/GamePlayPage";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 项目接口定义
interface Project {
  id: string;
  name: string;
  knowledgeBase: any[];
  createdAt: Date;
}

// NPC接口定义
interface NPC {
  id: string;
  name: string;
  role: string;
  avatar: string;
  position: { x: number; y: number };
  size: number; // NPC尺寸，百分比
  dialog: any[];
  personality?: string;
  speechPattern?: string;
  prompt?: string; // 人设提示词
  promptMode?: 'ai' | 'manual'; // 提示词模式
}

// 资产接口定义
interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'text' | 'other';
  imageCategory?: 'character' | 'scene' | 'prop'; // 图片细分分类
  size: string;
  preview?: string;
  category: string;
  tags: string[];
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // 默认已认证状态
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [generatedGame, setGeneratedGame] = useState<any>(null);
  const navigate = useNavigate();

  // 保存项目到本地存储
  const saveProjectsToLocalStorage = () => {
    try {
      if (projects.length > 0) {
        localStorage.setItem('gameProjects', JSON.stringify(projects));
        // console.log('项目数据已保存到本地存储');
      }
    } catch (error) {
      console.error('保存项目数据到本地存储失败:', error);
      toast.error('数据保存失败，请检查存储空间');
    }
  };

  // 从本地存储加载项目
  const loadProjectsFromLocalStorage = () => {
    try {
      const savedProjects = localStorage.getItem('gameProjects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        // 转换字符串日期回Date对象并验证数据结构
        const validProjects = parsedProjects.map((project: any) => ({
          ...project,
          id: project.id || 'project_' + Date.now(),
          name: project.name || '未命名项目',
          knowledgeBase: project.knowledgeBase || [],
          createdAt: project.createdAt ? new Date(project.createdAt) : new Date()
        }));
        return validProjects;
      }
    } catch (error) {
      console.error('从本地存储加载项目数据失败:', error);
      toast.error('数据加载失败，将使用新的项目数据');
      
      // 尝试移除损坏的存储数据
      try {
        localStorage.removeItem('gameProjects');
      } catch (removeError) {
        console.error('移除损坏的存储数据失败:', removeError);
      }
    }
    
    // 创建默认项目
    return [{
      id: 'project_' + Date.now(),
      name: '我的第一个游戏项目',
      knowledgeBase: [],
      createdAt: new Date()
    }];
  };

  // 初始化加载项目
  useEffect(() => {
    const projects = loadProjectsFromLocalStorage();
    setProjects(projects);
    setActiveProjectId(projects[0].id);
    toast.success('已加载项目数据');
  }, []);

  // 当项目变化时保存到本地存储
  useEffect(() => {
    if (projects.length > 0) {
      saveProjectsToLocalStorage();
    }
  }, [projects]);

  const logout = () => {
    setIsAuthenticated(false);
  };

  // 获取当前激活的项目
  const getActiveProject = (): Project | null => {
    if (!activeProjectId) return null;
    return projects.find(project => project.id === activeProjectId) || null;
  };

  // 创建新项目
  const createNewProject = (projectName: string) => {
    const newProject: Project = {
      id: 'project_' + Date.now(),
      name: projectName || '新游戏项目',
      knowledgeBase: [],
      createdAt: new Date()
    };
    
    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
    toast.success(`已创建新项目: ${newProject.name}`);
    return newProject;
  };

  // 更新项目名称
  const updateProjectName = (projectId: string, newName: string) => {
    if (!newName.trim()) return;
    
    setProjects(projects.map(project => 
      project.id === projectId ? { ...project, name: newName } : project
    ));
    toast.success('项目名称已更新');
  };

  // 删除项目
  const deleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      toast.error('至少保留一个项目');
      return;
    }
    
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    
    // 如果删除的是当前激活项目，切换到第一个项目
    if (activeProjectId === projectId) {
      setActiveProjectId(updatedProjects[0].id);
    }
    
    toast.success('项目已删除');
  };

  // 处理上传的IP资产并添加到当前项目的知识库
  const processIpAssets = (assets: Asset[]) => {
    const activeProject = getActiveProject();
    if (!activeProject) return [];
    
    // 处理资产分类
    const processedAssets = assets.map(asset => {
      let category = '';
      let tags = [asset.type];
      
      if (asset.type === 'image') {
        category = '视觉素材';
        if (asset.imageCategory === 'character') {
          tags.push('人物图');
        } else if (asset.imageCategory === 'scene') {
          tags.push('场景图');
        } else if (asset.imageCategory === 'prop') {
          tags.push('道具图');
        }
      } else if (asset.type === 'video') {
        category = '视频素材';
      } else if (asset.type === 'text') {
        category = '文本资料';
      } else {
        category = '其他素材';
      }
      
      tags.push('IP相关', '自动分类');
      
      return {
        ...asset,
        category,
        tags
      };
    });
    
    // 更新当前项目的知识库
    setProjects(projects.map(project => 
      project.id === activeProjectId 
        ? { ...project, knowledgeBase: [...project.knowledgeBase, ...processedAssets] } 
        : project
    ));
    
    return processedAssets;
  };

  // 从知识库中删除资产
  const removeAssetFromKnowledgeBase = (assetId: string) => {
    const activeProject = getActiveProject();
    if (!activeProject) return;
    
    setProjects(projects.map(project => 
      project.id === activeProjectId 
        ? { 
            ...project, 
            knowledgeBase: project.knowledgeBase.filter(asset => asset.id !== assetId) 
          } 
        : project
    ));
  };

  // 存储编辑器中的场景数据
  const [editorScenes, setEditorScenes] = useState([]);
  
  // 更新编辑器场景数据
  const updateEditorScenes = (scenes) => {
    setEditorScenes(scenes);
  };
  
  // 生成游戏
  const generateGame = () => {
    const activeProject = getActiveProject();
    if (!activeProject || activeProject.knowledgeBase.length === 0) {
      toast.error('请先为当前项目添加知识库内容');
      return null;
    }
    
    // 使用编辑器中的场景数据生成游戏
    const game = {
      id: 'game_' + Date.now(),
      title: `${activeProject.name} - 解谜游戏`,
      projectId: activeProject.id,
      scenes: editorScenes.map(scene => ({
        ...scene,
        // 保留场景中的元素和NPC
        elements: scene.elements || [],
        npcs: scene.npcs || []
      }))
    };
    
    setGeneratedGame(game);
    return game;
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, logout }}
    >
      <div className={cn("min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100")}>
        <Navbar />
        <main className={cn("container mx-auto px-4 py-8")}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/upload" 
              element={<UploadPage onProcessAssets={processIpAssets} />} 
            />
            <Route 
              path="/knowledge" 
              element={<KnowledgeBasePage 
                         projects={projects}
                         activeProjectId={activeProjectId}
                         setActiveProjectId={setActiveProjectId}
                         createNewProject={createNewProject}
                         updateProjectName={updateProjectName}
                         deleteProject={deleteProject}
                         removeAssetFromKnowledgeBase={removeAssetFromKnowledgeBase}
                       />}
            />
            <Route 
               path="/editor" 
               element={<GameEditorPage 
                         project={getActiveProject()}
                         onGenerateGame={generateGame} 
                         game={generatedGame}
                         scenes={editorScenes}
                         updateScenes={updateEditorScenes}
                       />} 
            />
            <Route 
              path="/play/:gameId" 
              element={<GamePlayPage game={generatedGame} />} 
            />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}