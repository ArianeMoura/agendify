import { api } from './config';
import {
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  User,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
} from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  // Aceita um convite (anônimo): cria a conta no tenant do convite. Não devolve
  // tokens — em seguida o chamador faz login com o e-mail retornado + a senha.
  acceptInvitation: async (
    data: AcceptInvitationRequest,
  ): Promise<AcceptInvitationResponse> => {
    const response = await api.post<AcceptInvitationResponse>(
      '/invitations/accept',
      data,
    );
    return response.data;
  },

  register: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  // Revoga o refresh token no backend (logout do lado do servidor).
  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  // Pede o link de redefinição (anônimo). A API responde igual para e-mail cadastrado
  // ou não — de propósito, para não revelar quem tem conta. Não trate como sucesso/falha
  // de existência.
  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  // Troca a senha usando o token do e-mail. O token é de uso único e expira em 30 min.
  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, password });
  },
};
