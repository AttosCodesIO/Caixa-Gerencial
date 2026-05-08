import { vi } from 'vitest';

export const getMockUser = (overrides?: Record<string, unknown>) => {
  return {
    id: '123',
    email: 'usuario@teste.com',
    ...overrides,
  };
};

export const getMockAuthContext = (overrides?: Record<string, unknown>) => {
  return {
    user: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
};
