import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface UploadPageProps {
  onProcessAssets: (assets: any[]) => any[];
}

export default function UploadPage({ onProcessAssets }: UploadPageProps) {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // 处理文件拖放
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  const [imageCategory, setImageCategory] = useState<string>('character');
  
  // 处理文件上传
  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files).map(file => {
      const fileType = getFileType(file.type);
      return {
        id: 'asset_' + Date.now() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: fileType,
        imageCategory: fileType === 'image' ? imageCategory as 'character' | 'scene' | 'prop' : undefined,
        size: formatFileSize(file.size),
        file: file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      };
    });
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // 显示上传成功提示
    toast.success(`已上传 ${newFiles.length} 个文件`);
  };
  
  // 获取文件类型
  const getFileType = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('text/') || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type)) {
      return 'text';
    }
    return 'other';
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // 移除已上传文件
  const removeFile = (id: string) => {
    const file = uploadedFiles.find(f => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    toast.info('文件已移除');
  };
  
  // 处理资料提交和AI处理
  const handleProcess = () => {
    if (uploadedFiles.length === 0) {
      toast.error('请先上传至少一个文件');
      return;
    }
    
    setProcessing(true);
    toast.info('正在处理您的资料...');
    
    // 模拟AI处理延迟
     setTimeout(() => {
       try {
         const processedAssets = onProcessAssets(uploadedFiles);
         setProcessing(false);
         toast.success('资料处理完成！已存入知识库');
         navigate('/knowledge');
       } catch (error) {
         console.error('资料处理失败:', error);
         setProcessing(false);
         toast.error('资料处理失败，请重试');
       }
     }, 2000);
  };
  
  return (
    <div className={cn("max-w-4xl mx-auto")}>
      <h1 className={cn("text-3xl font-bold mb-8 text-center")}>上传IP相关资料</h1>
      
      <div className={cn("mb-8")}>
        <h2 className={cn("text-xl font-semibold mb-4")}>资料上传区</h2>
        
        {/* 拖放区域 */}
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
            isDragging 
              ? "border-blue-500 bg-blue-500/10" 
              : "border-gray-700 hover:border-gray-500 bg-gray-800/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            className={cn("hidden")}
            accept="image/*,video/*,.txt,.pdf,.doc,.docx,.csv,.json"
          />
          
            <div className={cn("text-5xl mb-4 text-gray-400")}>
              <i className="fa-solid fa-cloud-upload-alt"></i>
            </div>
            
            <h3 className={cn("text-xl font-medium mb-2")}>拖放文件到此处或点击上传</h3>
            <p className={cn("text-gray-400 mb-4")}>支持图片、文字、视频等IP相关资料</p>
            
            {/* 图片分类选择 - 仅在上传图片时显示 */}
             <div 
               className={cn("mb-4 p-3 bg-gray-900/50 rounded-lg inline-block")}
               onClick={(e) => e.stopPropagation()}
             >
               <label className={cn("text-sm text-gray-400 mr-2")}>图片分类:</label>
               <select
                 value={imageCategory}
                 onChange={(e) => setImageCategory(e.target.value)}
                 className={cn("bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500")}
               >
                 <option value="character">人物图</option>
                 <option value="scene">场景图</option>
                 <option value="prop">道具图</option>
               </select>
             </div>
            
            <button 
              className={cn("px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors")}
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件
            </button>
        </div>
      </div>
      
      {/* 已上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className={cn("mb-8")}>
          <div className={cn("flex justify-between items-center mb-4")}>
            <h2 className={cn("text-xl font-semibold")}>已上传文件 ({uploadedFiles.length})</h2>
            <button 
              onClick={() => setUploadedFiles([])}
              className={cn("text-sm text-gray-400 hover:text-red-400")}
            >
              全部清除
            </button>
          </div>
          
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2")}>
            {uploadedFiles.map((file) => (
              <div 
                key={file.id}
                className={cn("bg-gray-800 rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-750 transition-colors")}
              >
                {/* 文件类型图标 */}
                <div className={cn("text-2xl p-2 rounded bg-gray-700")}>
                  {file.type === 'image' && <i className="fa-solid fa-image text-green-400"></i>}
                  {file.type === 'video' && <i className="fa-solid fa-video text-purple-400"></i>}
                  {file.type === 'text' && <i className="fa-solid fa-file-text text-blue-400"></i>}
                  {file.type === 'other' && <i className="fa-solid fa-file text-gray-400"></i>}
                </div>
                
                {/* 文件信息 */}
                <div className={cn("flex-1 min-w-0")}>
                  <h4 className={cn("font-medium truncate")}>{file.name}</h4>
                  <p className={cn("text-sm text-gray-400")}>
                    {file.type.toUpperCase()} • {file.size}
                  </p>
                </div>
                
                {/* 操作按钮 */}
                <button 
                  onClick={() => removeFile(file.id)}
                  className={cn("text-gray-400 hover:text-red-400 p-2")}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 处理按钮 */}
      <div className={cn("flex justify-center mt-8")}>
        <button
          onClick={handleProcess}
          disabled={processing || uploadedFiles.length === 0}
          className={cn(
            "px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center",
            (processing || uploadedFiles.length === 0)
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transform hover:-translate-y-1"
          )}
        >
          {processing ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i> 处理中...
            </>
          ) : (
            <>
              <i className="fa-solid fa-magic mr-2"></i> 开始AI处理并生成知识库
            </>
          )}
        </button>
      </div>
    </div>
  );
}