import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  LogOut, 
  Moon, 
  Sun, 
  User, 
  FolderKanban, 
  DollarSign, 
  TrendingUp,
  Shield,
  UserCircle,
  ChevronDown,
  Home
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showBack?: boolean;
  backPath?: string;
}

export default function AppHeader({ 
  title, 
  subtitle, 
  icon,
  showBack = false,
  backPath
}: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin': return '/admin';
      case 'employee': return '/employee';
      case 'client': return '/client';
      default: return '/auth';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'employee': return <UserCircle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: getDashboardPath(), label: 'Dashboard', icon: Home },
    { path: '/workspaces', label: 'Projects', icon: FolderKanban },
    { path: '/payments', label: 'Payments', icon: DollarSign, roles: ['admin', 'employee'] },
    ...(user?.role === 'admin' ? [{ path: '/revenue', label: 'Revenue', icon: TrendingUp, roles: ['admin'] }] : []),
  ];

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Title Section */}
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate(getDashboardPath())}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-premium-sm group-hover:shadow-premium-md transition-shadow">
              {icon || <Building2 className="h-5 w-5 text-primary-foreground" />}
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-semibold text-foreground leading-tight">
                {title || 'Agency Dashboard'}
              </h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(user?.role || '')) return null;
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={isActive(item.path) ? 'secondary' : 'ghost'}
                size="sm"
                className={`gap-2 ${isActive(item.path) ? 'bg-secondary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2 pr-3 h-9">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.profile?.profilePicture} alt={user?.name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                  {user?.name}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {getRoleIcon()}
                    <span className="capitalize">{user?.role}</span>
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Mobile Navigation */}
              <div className="md:hidden">
                {navItems.map((item) => {
                  if (item.roles && !item.roles.includes(user?.role || '')) return null;
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </div>

              <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
