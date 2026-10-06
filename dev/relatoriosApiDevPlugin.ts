import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin, ViteDevServer, Connect } from 'vite';
import dotenv from 'dotenv';
import { parse as parseQuery } from 'querystring';

/**
 * Só existe para `npm run dev` (Vite). Em produção (Vercel) as mesmas funções
 * em api/relatorios/*.ts rodam nativamente como Serverless Functions — este
 * plugin apenas replica esse roteamento dentro do dev server do Vite, para
 * testar o módulo Relatórios em localhost sem precisar de `vercel dev`
 * (que exige `vercel login`, indisponível neste ambiente).
 *
 * Vite só injeta variáveis prefixadas com VITE_ em import.meta.env — nunca
 * popula process.env com o resto do .env. As funções em api/relatorios usam
 * process.env diretamente (é o que a Vercel injeta nativamente em produção),
 * então aqui, só para o dev server local, carregamos o .env manualmente.
 */
dotenv.config();

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

type VercelLikeResponse = ServerResponse & {
  status: (code: number) => VercelLikeResponse;
  json: (body: unknown) => void;
};

function toVercelLikeResponse(res: ServerResponse): VercelLikeResponse {
  const r = res as VercelLikeResponse;
  r.status = (code: number) => {
    r.statusCode = code;
    return r;
  };
  r.json = (body: unknown) => {
    if (!r.getHeader('Content-Type')) r.setHeader('Content-Type', 'application/json');
    r.end(JSON.stringify(body));
  };
  return r;
}

function mount(
  server: ViteDevServer,
  route: string,
  modulePath: string,
  { parseJsonBody }: { parseJsonBody: boolean },
) {
  const handlerWrapper: Connect.NextHandleFunction = async (req, res, next) => {
    if (req.url?.split('?')[0] !== route) {
      next();
      return;
    }
    try {
      if (parseJsonBody && req.method === 'POST') {
        (req as IncomingMessage & { body?: unknown }).body = await readJsonBody(req);
      }
      // A Vercel sempre expõe req.query (populado automaticamente em produção) —
      // aqui replicamos isso a partir da querystring da URL, para os endpoints GET
      // com parâmetros (ex.: ?filial=).
      const queryString = req.url?.split('?')[1] ?? '';
      (req as IncomingMessage & { query?: unknown }).query = parseQuery(queryString);
      const mod = await server.ssrLoadModule(modulePath);
      await mod.default(req, toVercelLikeResponse(res));
    } catch (error) {
      console.error(`[relatorios-api-dev] Erro em ${route}:`, error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Erro interno no dev server (ver terminal do Vite).' }));
    }
  };
  server.middlewares.use(handlerWrapper);
}

export function relatoriosApiDevPlugin(): Plugin {
  return {
    name: 'relatorios-api-dev',
    apply: 'serve',
    configureServer(server) {
      mount(server, '/api/relatorios/filiais', '/api/relatorios/filiais.ts', {
        parseJsonBody: false,
      });
      mount(server, '/api/relatorios/dados', '/api/relatorios/dados.ts', {
        parseJsonBody: true,
      });
      mount(server, '/api/relatorios/saldo-bancario/contas', '/api/relatorios/saldo-bancario/contas.ts', {
        parseJsonBody: false,
      });
      mount(server, '/api/relatorios/saldo-bancario/dados', '/api/relatorios/saldo-bancario/dados.ts', {
        parseJsonBody: true,
      });
    },
  };
}
