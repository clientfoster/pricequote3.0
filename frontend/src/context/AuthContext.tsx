import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'SuperAdmin' | 'Employee';
    profileImage?: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: FormData) => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const { data } = await api.post('/auth/login', { email: normalizedEmail, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            toast.success('Login successful');
        } catch (error: any) {
            const message =
                error.response?.data?.message ||
                (error.request ? 'Cannot reach backend API. Check backend server/CORS.' : 'Login failed');
            toast.error(message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
        toast.success('Logged out');
    };

    const updateProfile = async (formData: FormData) => {
        try {
            // If image upload is separate, handle it here or in component. 
            // Assuming backend handles multipart/form-data on /users/profile OR we upload first.
            // The backend helper I wrote for profile update uses JSON body for data, but I didn't add upload middleware to that route yet.
            // Wait, I only added upload route separately.
            // So I should upload image first if present, then update profile.

            // Implementation detail: User passes FormData. If image exists, upload it.
            const file = formData.get('file');
            let profileImageUrl = user?.profileImage;

            if (file && file instanceof File) {
                const uploadData = new FormData();
                uploadData.append('file', file);
                const { data } = await api.post('/upload', uploadData);
                profileImageUrl = data.filePath; // Cloudinary returns full URL
            }

            const updateData: any = {};
            if (formData.get('name')) updateData.name = formData.get('name');
            if (formData.get('email')) updateData.email = formData.get('email');
            if (formData.get('password')) updateData.password = formData.get('password');
            if (profileImageUrl) updateData.profileImage = profileImageUrl;

            const { data } = await api.put('/users/profile', updateData);
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            toast.success('Profile updated');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Update failed');
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateProfile, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
