import type { IncomingMessage, ServerResponse } from 'http';

// Formato de req/res que a Vercel entrega às Serverless Functions Node (e que
// dev/relatoriosApiDevPlugin.ts replica no `npm run dev`). Declarado aqui para
// não depender do pacote @vercel/node só por causa dos tipos.
export type ApiRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};
