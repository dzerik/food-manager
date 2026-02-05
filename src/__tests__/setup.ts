import "@testing-library/jest-dom";
import { vi } from "vitest";

// Мокаем next/server модуль
vi.mock("next/server", () => {
  return {
    NextRequest: class MockNextRequest {
      url: string;
      nextUrl: URL;
      method: string;
      private _body: string | undefined;

      constructor(url: string, options?: { method?: string; body?: string }) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.method = options?.method || "GET";
        this._body = options?.body;
      }

      async json() {
        return this._body ? JSON.parse(this._body) : null;
      }
    },
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => {
        return {
          json: async () => data,
          status: init?.status || 200,
          ok: !init?.status || init.status < 400,
          headers: new Headers(init?.headers),
        };
      },
    },
  };
});

// Глобальный сброс моков перед каждым тестом
beforeEach(() => {
  vi.clearAllMocks();
});
