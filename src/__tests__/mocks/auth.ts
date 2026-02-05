import { vi } from "vitest";

/**
 * Мок для функции auth из NextAuth.
 * Позволяет настраивать возвращаемую сессию в тестах.
 */
export const mockAuth = vi.fn();

// Экспорт функции auth
export const auth = mockAuth;

/**
 * Тестовый пользователь - используется как стандартная сессия.
 */
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  image: null,
};

/**
 * Аутентифицированная сессия для тестов.
 */
export const mockAuthenticatedSession = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Настраивает auth мок для возврата аутентифицированной сессии.
 */
export const setAuthenticatedSession = (user = mockUser) => {
  mockAuth.mockResolvedValue({ user, expires: new Date(Date.now() + 86400000).toISOString() });
};

/**
 * Настраивает auth мок для возврата null (неавторизован).
 */
export const setUnauthenticatedSession = () => {
  mockAuth.mockResolvedValue(null);
};

/**
 * Сбрасывает auth мок.
 */
export const resetAuthMock = () => {
  mockAuth.mockReset();
};
