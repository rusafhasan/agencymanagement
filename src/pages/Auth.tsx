import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, Moon, Sun } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getRedirectPath = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin': return '/admin';
      case 'employee': return '/employee';
      case 'client': return '/client';
      default: return '/client';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          const stored = localStorage.getItem('agency_dashboard_user');
          if (stored) {
            const user = JSON.parse(stored);
            navigate(getRedirectPath(user.role));
          }
        } else {
          toast({ title: 'Login failed', description: result.error, variant: 'destructive' });
        }
      } else {
        if (!name.trim()) {
          toast({ title: 'Name required', description: 'Please enter your name', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }

        const result = await signup(email, password, name);
        if (result.success) {
          toast({ title: 'Account created', description: 'Welcome! You have been registered as a client.' });
          navigate('/client');
        } else {
          toast({ title: 'Signup failed', description: result.error, variant: 'destructive' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="sr-only">Toggle theme</span>
      </Button>

      <div className="w-full max-w-md animate-fade-in">
        <Card className="card-premium">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-premium-md">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-display">
                {isLogin ? 'Welcome back' : 'Create account'}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? 'Sign in to access your dashboard'
                  : 'Sign up as a client to get started'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11 shadow-premium-sm hover:shadow-premium-md transition-shadow" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Agency Dashboard • Secure Login
        </p>
      </div>
    </div>
  );
}
