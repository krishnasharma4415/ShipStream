import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2"
      >
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="w-8 h-8 rounded-full"
        />
        <span className="hidden md:block">{user.username}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md shadow-lg py-1 z-50 border-0">
          <div className="px-4 py-2 text-sm text-foreground border-b border-border">
            <div className="font-medium">{user.username}</div>
            <div className="text-muted-foreground">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}