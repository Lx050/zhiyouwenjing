import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// 功能卡片组件
function FeatureCard({ icon, title, description }) {
  return (
    <motion.div 
      className={cn("bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1")}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.random() * 0.3 }}
    >
      <div className={cn("text-4xl text-blue-400 mb-4")}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <h3 className={cn("text-xl font-bold mb-2")}>{title}</h3>
      <p className={cn("text-gray-400")}>{description}</p>
    </motion.div>
  );
}

// 步骤卡片组件
function StepCard({ number, title, description, bgColor }) {
  return (
    <div className={cn("bg-gray-800 rounded-xl p-6 shadow-lg text-center relative")}>
      <div className={cn(`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 mx-auto ${bgColor}`)}>
        {number}
      </div>
      <h3 className={cn("text-xl font-bold mb-2")}>{title}</h3>
      <p className={cn("text-gray-400")}>{description}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center text-center p-4")}>
      {/* Hero Section */}
      <section className={cn("mb-20 max-w-4xl mx-auto")}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className={cn("text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500")}>
  智游文境
</h1>
<p className={cn("text-xl text-gray-400 mb-6 text-center")}>
  基于文化遗产的AI游戏工坊
</p>
<p className={cn("text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto")}>
    上传IP资料，AI自动为您生成点击式解谜游戏
  </p>
          <div className={cn("flex flex-col sm:flex-row gap-4 justify-center")}>
            <Link 
              to="/upload"
              className={cn("px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-semibold text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-1")}
            >
              开始创建游戏
            </Link>
            <Link 
              to="/knowledge"
              className={cn("px-8 py-4 bg-gray-800 rounded-xl text-white font-semibold text-lg shadow-lg hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1")}
            >
              查看知识库
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className={cn("grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20")}>
        <FeatureCard 
          icon="fa-cloud-upload-alt" 
          title="资料上传" 
          description="上传IP相关的图片、文字和视频资料，构建专属知识库" 
        />
        <FeatureCard 
          icon="fa-brain" 
          title="智能分类" 
          description="AI自动分析和分类您的资料，建立结构化的IP素材库" 
        />
        <FeatureCard 
          icon="fa-gamepad" 
          title="游戏生成" 
          description="一键生成完整点击式解谜游戏，包含场景和互动元素" 
        />
        <FeatureCard 
          icon="fa-comments" 
          title="NPC对话" 
          description="智能NPC角色，支持自然语言交互，丰富游戏体验" 
        />
        <FeatureCard 
          icon="fa-paint-brush" 
          title="素材生成" 
          description="基于上传资料自动生成游戏所需的各类视觉素材" 
        />
        <FeatureCard 
          icon="fa-play-circle" 
          title="即玩体验" 
          description="生成完成即可在浏览器中游玩，无需复杂部署" 
        />
      </section>

      {/* How It Works Section */}
      <section className={cn("max-w-4xl mx-auto mb-20")}>
        <h2 className={cn("text-3xl font-bold mb-10 text-center")}>简单三步，创建专属游戏</h2>
        <div className={cn("relative")}>
          {/* Steps Line */}
          <div className={cn("hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform -translate-y-1/2 z-0")}></div>
          
          <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10")}>
            <StepCard 
              number="1" 
              title="上传资料" 
              description="上传IP相关的图片、文字和视频资料" 
              bgColor="from-blue-500 to-indigo-500"
            />
            <StepCard 
              number="2" 
              title="AI处理" 
              description="系统自动分析资料并生成游戏素材" 
              bgColor="from-purple-500 to-pink-500"
            />
            <StepCard 
              number="3" 
              title="开始游戏" 
              description="生成完成，立即体验您的专属解谜游戏" 
              bgColor="from-green-500 to-teal-500"
            />
          </div>
        </div>
      </section>
    </div>
  );
}