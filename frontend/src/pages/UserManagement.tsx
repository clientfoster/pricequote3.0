import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, UserPlus, Mail, Shield, User as UserIcon, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'SuperAdmin' | 'Employee';
    isVerified: boolean;
    createdAt: string;
}

export default function UserManagement() {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    // Invite Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Employee');
    const [isInviting, setIsInviting] = useState(false);
    const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
    const [lastInviteEmailSent, setLastInviteEmailSent] = useState<boolean | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
    const [roleFilter, setRoleFilter] = useState<'all' | 'Employee' | 'SuperAdmin'>('all');

    // Fetch Users
    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        },
    });

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            const { data } = await api.post('/users/invite', { name, email, role });
            setLastInviteUrl(data?.inviteUrl || null);
            setLastInviteEmailSent(
                typeof data?.emailSent === 'boolean' ? data.emailSent : null
            );
            toast.success(data?.message || `Invitation created for ${email}`);
            setName('');
            setEmail('');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this user? This action cannot be undone.')) return;

        try {
            await api.delete(`/users/${userId}`);
            toast.success('User removed successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.isVerified) ||
            (statusFilter === 'pending' && !user.isVerified);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesStatus && matchesRole;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
                <p className="text-muted-foreground mt-1">
                    Manage team members, roles, and invitations.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invite Form */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-accent" />
                            Invite New User
                        </CardTitle>
                        <CardDescription>
                            Create an invite link and optionally email it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g., john@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                        <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {role === 'SuperAdmin'
                                        ? 'Can manage users and system settings.'
                                        : 'Can create and manage quotations.'}
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={isInviting}>
                                {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
                                {!isInviting && <Mail className="ml-2 w-4 h-4" />}
                            </Button>
                        </form>
                        {lastInviteUrl && (
                            <div className="mt-4 rounded-md border bg-muted/30 p-3 space-y-2">
                                <p className="text-xs text-muted-foreground">
                                    {lastInviteEmailSent
                                        ? 'Email sent. You can also copy the invite link:'
                                        : 'Email not sent. Copy the invite link:'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Input value={lastInviteUrl} readOnly />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(lastInviteUrl);
                                            toast.success('Invite link copied');
                                        }}
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* User List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                            List of all registered users and their current status.
                        </CardDescription>
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="text-xs font-semibold text-muted-foreground">Status</span>
                            <Button
                                size="sm"
                                variant={statusFilter === 'all' ? 'secondary' : 'outline'}
                                onClick={() => setStatusFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                size="sm"
                                variant={statusFilter === 'active' ? 'secondary' : 'outline'}
                                onClick={() => setStatusFilter('active')}
                            >
                                Active
                            </Button>
                            <Button
                                size="sm"
                                variant={statusFilter === 'pending' ? 'secondary' : 'outline'}
                                onClick={() => setStatusFilter('pending')}
                            >
                                Pending
                            </Button>
                            <span className="ml-2 text-xs font-semibold text-muted-foreground">Role</span>
                            <Button
                                size="sm"
                                variant={roleFilter === 'all' ? 'secondary' : 'outline'}
                                onClick={() => setRoleFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                size="sm"
                                variant={roleFilter === 'Employee' ? 'secondary' : 'outline'}
                                onClick={() => setRoleFilter('Employee')}
                            >
                                Employee
                            </Button>
                            <Button
                                size="sm"
                                variant={roleFilter === 'SuperAdmin' ? 'secondary' : 'outline'}
                                onClick={() => setRoleFilter('SuperAdmin')}
                            >
                                Admin
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading users...</div>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <Table className="min-w-[700px]">
                                    <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.name}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {user.role === 'SuperAdmin' ? (
                                                            <Shield className="w-3.5 h-3.5 text-accent" />
                                                        ) : (
                                                            <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                        )}
                                                        <span className={user.role === 'SuperAdmin' ? 'text-accent font-medium' : ''}>
                                                            {user.role === 'SuperAdmin' ? 'Admin' : 'Employee'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {user.isVerified ? (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none gap-1">
                                                            <Check className="w-3 h-3" /> Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1">
                                                            <Clock className="w-3 h-3" /> Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        disabled={user.role === 'SuperAdmin' || user._id === currentUser?._id}
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        title={user.role === 'SuperAdmin' ? "Cannot delete Admin" : "Delete User"}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No users found for the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
