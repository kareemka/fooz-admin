import api from '@/lib/api';
import { LoginInput } from '@/schemas';
import Cookies from 'js-cookie';

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    accessToken: string;
}

export const authService = {
    login: async (credentials: LoginInput) => {
        const { data } = await api.post<AuthResponse>('/auth/login', credentials);
        if (data.accessToken) {
            Cookies.set('token', data.accessToken, { expires: 7, path: '/' });
            Cookies.set('user', JSON.stringify(data.user), { expires: 7, path: '/' });
        }
        return data;
    },
    logout: () => {
        Cookies.remove('token');
        Cookies.remove('user');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    },
    getCurrentUser: () => {
        const user = Cookies.get('user');
        return user ? JSON.parse(user) : null;
    },
};
