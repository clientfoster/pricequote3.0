import { useState, useEffect } from 'react';
import { Building2, CreditCard, Bell, Shield, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      setName(parsedUser.name);
      setEmail(parsedUser.email);
    }
  }, []);

  const handleUpdateProfile = async () => {
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdating(true);
    try {
      const { data } = await api.put('/users/profile', {
        name,
        email,
        password: password || undefined,
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      toast.success('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-14 md:top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account and application preferences.
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">

          {/* Company Info */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Company Information</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Your business details for quotations.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <Label>Company Name</Label>
                  <Input defaultValue={user?.tenantName || ''} placeholder="Company Name" disabled />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input defaultValue="" placeholder="Add GSTIN" disabled />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Update company details during setup.</p>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <UserIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Profile</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Your personal account settings.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user?.role || ''} disabled className="bg-muted" />
                </div>
              </div>
              <div className="pt-2">
                <Button variant="accent" onClick={handleUpdateProfile} disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications (Mock) */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Notifications</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Configure how you receive updates.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Quote Expiry Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified when quotes are about to expire.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
