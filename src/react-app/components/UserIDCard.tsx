import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { UserData } from '@/shared/types';

interface UserIDCardProps {
  userData: UserData;
  showID?: boolean;
  onCopy?: () => void;
}

export default function UserIDCard({ userData, showID = true, onCopy }: UserIDCardProps) {
  const [copied, setCopied] = useState(false);
  const [showFullID, setShowFullID] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userData.userID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const maskID = (id: string) => {
    if (showFullID) return id;
    return id.slice(0, 4) + '****' + id.slice(-2);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="text-center space-y-4">
        {/* Avatar */}
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {userData.displayName.slice(0, 2).toUpperCase()}
        </div>

        {/* Display Name */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {userData.displayName}
          </h2>
          <p className="text-sm text-gray-500">Your anonymous identity</p>
        </div>

        {/* User ID */}
        {showID && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Your ID:</span>
              <button
                onClick={() => setShowFullID(!showFullID)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {showFullID ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            
            <div className="font-mono text-lg font-bold text-gray-800 tracking-wider">
              {maskID(userData.userID)}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Creation Date */}
        <div className="text-xs text-gray-400">
          Created {new Date(userData.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
