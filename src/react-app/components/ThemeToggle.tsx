import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/react-app/hooks/useTheme';

export default function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        fixed top-4 right-4 z-50 w-8 h-8 rounded-full border 
        flex items-center justify-center transition-all duration-300 transform hover:scale-110
        shadow-md backdrop-blur-sm
        ${isDark 
          ? 'bg-gray-800/90 border-gray-600 text-yellow-400 hover:bg-gray-700/90' 
          : 'bg-white/90 border-gray-200 text-gray-600 hover:bg-gray-50/90'
        }
      `}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun icon */}
        <Sun 
          className={`w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
            isDark 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
          }`} 
        />
        {/* Moon icon */}
        <Moon 
          className={`w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`} 
        />
      </div>
    </button>
  );
}
