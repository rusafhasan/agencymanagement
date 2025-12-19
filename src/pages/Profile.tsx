import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Lock, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { profileUpdateSchema, passwordChangeSchema, formatValidationErrors } from '@/lib/validation';

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [address, setAddress] = useState(user?.profile?.address || '');
  const [companyName, setCompanyName] = useState(user?.profile?.companyName || '');
  const [profilePicture, setProfilePicture] = useState(user?.profile?.profilePicture || '');
  const [previewPicture, setPreviewPicture] = useState(user?.profile?.profilePicture || '');
  const [profileError, setProfileError] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please select a JPEG, PNG, GIF, or WebP image.', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: 'File too large', 
        description: 'Please select an image under 2MB.', 
        variant: 'destructive' 
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => { 
      const result = reader.result as string; 
      setPreviewPicture(result); 
      setProfilePicture(result); 
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    setProfileError(null);

    // Validate profile inputs
    const validation = profileUpdateSchema.safeParse({ name, phone, address, companyName });
    if (!validation.success) {
      setProfileError(formatValidationErrors(validation.error));
      return;
    }

    const success = updateProfile({ 
      name: validation.data.name, 
      profile: { 
        phone: validation.data.phone || '', 
        address: validation.data.address || '', 
        companyName: validation.data.companyName || '', 
        profilePicture 
      } 
    });

    if (success) {
      toast({ title: 'Profile updated', description: 'Your profile has been saved successfully.' });
    } else {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    // Validate password inputs
    const validation = passwordChangeSchema.safeParse({ oldPassword, newPassword, confirmPassword });
    if (!validation.success) {
      setPasswordError(formatValidationErrors(validation.error));
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(oldPassword, newPassword);
    setIsChangingPassword(false);
    
    if (result.success) { 
      toast({ title: 'Password changed' }); 
      setOldPassword(''); 
      setNewPassword(''); 
      setConfirmPassword(''); 
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="page-container">
      <AppHeader title="My Profile" subtitle="Manage your personal information" icon={<User className="h-5 w-5 text-primary-foreground" />} />

      <main className="content-container max-w-2xl">
        <Card className="card-premium mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="font-display">Profile Picture</CardTitle>
            <CardDescription>Upload a photo to personalize your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={previewPicture} alt={name} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary font-display">{getInitials(name || 'U')}</AvatarFallback>
                </Avatar>
                <Button variant="secondary" size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-premium-sm" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4" />
                </Button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.gif,.webp" 
                  className="hidden" 
                  onChange={handleImageSelect} 
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Click the camera icon to upload. Max: 2MB. Formats: JPEG, PNG, GIF, WebP.</p>
                {previewPicture && <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => { setPreviewPicture(''); setProfilePicture(''); }}>Remove photo</Button>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-premium mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="font-display">Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, Country" maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" maxLength={100} />
            </div>
            <Button onClick={handleSaveProfile} className="w-full gap-2">
              <Save className="h-4 w-4" />Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="card-premium animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Lock className="h-5 w-5 text-primary" />Change Password
            </CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter current password" maxLength={128} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 chars, uppercase, lowercase, number" maxLength={128} />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" maxLength={128} />
            </div>
            <Button onClick={handleChangePassword} variant="outline" className="w-full" disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
