import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";

function NavLink({ to, children, isActive }) {
  return (
    <Link 
      to={to}
      className={cn(
        "text-sm font-medium transition-colors hover:text-blue-400",
        isActive 
          ? "text-blue-400 border-b-2 border-blue-400" 
          : "text-gray-300 hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, logout } = useContext(AuthContext);
  
  const navItems = [
    { path: "/", label: "首页" },
    { path: "/upload", label: "资料上传" },
    { path: "/knowledge", label: "知识库" },
    { path: "/editor", label: "游戏编辑" }
  ];
  
  return (
    <nav className={cn("bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50")}>
      <div className={cn("container mx-auto px-4")}>
        <div className={cn("flex justify-between h-16 items-center")}>
          <div className={cn("flex items-center")}>
            <Link to="/" className={cn("flex items-center")}>
              <i className="fa-solid fa-gamepad text-blue-400 text-2xl mr-2"></i>
              <span className={cn("text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500")}>
         智游文境
              </span>
            </Link>
          </div>
          
          <div className={cn("hidden md:flex space-x-8")}>
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                isActive={location.pathname === item.path}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          
          <div className={cn("flex items-center space-x-4")}>
            <button 
              onClick={logout}
              className={cn("px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors")}
            >
              <i className="fa-solid fa-sign-out-alt mr-1"></i> 退出
            </button>
            
            <button className={cn("md:hidden text-xl")}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}