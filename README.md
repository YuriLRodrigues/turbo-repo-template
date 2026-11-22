**🇧🇷 Português** · [🇺🇸 English](./README.en.md)

# turbo-repo-template

Um monorepo full-stack para começar um produto: contas, sessões, preferências, um design system e um pequeno contexto
de exemplo já vêm prontos, testados e documentados, para que o primeiro dia vá para o que torna o produto diferente.

- **API**: NestJS 12 + Drizzle ORM 1.0 sobre Postgres, arquitetura limpa, um Postgres embutido (PGlite) para
  desenvolvimento e testes, Swagger e um documento OpenAPI exportado.
- **Web**: Next.js 16 como export estático, TanStack Query sobre um cliente gerado pelo Orval, react-hook-form + zod,
  um shell com barra lateral recolhível e barra de abas no celular.
- **Landing**: uma página de produto mínima em português, inglês e espanhol, com seletor de idioma e o SEO básico
  (hreflang, `og:locale`, imagem de compartilhamento e sitemap por idioma).
- **Design system**: tokens neutros no Tailwind v4, primitivos do Base UI com a anatomia do shadcn, nove gráficos
  configuráveis em Recharts, temas claro/escuro com seis cores de destaque, contraste conferido.
- **Ferramentas**: Turborepo, npm workspaces, ESLint (com as regras de camada da API), Prettier, Vitest, Playwright,
  husky + lint-staged + commitlint, skills do Claude Code.

## Primeiros passos

Requisitos: Node.js 24 ou mais novo (npm 12). Mais nada: sem Docker, sem banco de dados, sem `.env`.

```bash
npm install
npm run dev
```

- API: <http://localhost:3500> (Swagger em <http://localhost:3500/docs>). Ela sobe um Postgres embutido em
  `apps/api/.pglite/`, aplica as migrations e escreve os e-mails (confirmação, troca de senha) no próprio log.
- Web: <http://localhost:3501>. Crie uma conta e escreva uma nota.
- Landing: `npm run dev:landing` e depois <http://localhost:3502> (português), `/en/` e `/es/`.

Para usar um Postgres de verdade, copie `apps/api/.env.example` para `apps/api/.env`, preencha `DATABASE_URL` (o
`docker-compose.yml` de `apps/api` sobe um) e rode `npm run db:migrate`.

## Scripts

| Script                                        | O que faz                                                        |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                                 | API + web em modo watch                                          |
| `npm run dev:api` / `dev:web` / `dev:landing` | um app só                                                        |
| `npm run build`                               | todos os apps e pacotes                                          |
| `npm run preview` / `preview:landing`         | serve um export estático como um host estático                   |
| `npm run lint` / `lint:check`                 | ESLint em todos os workspaces (corrige / confere)                |
| `npm run format` / `format:check`             | Prettier (escreve / confere)                                     |
| `npm run typecheck`                           | TypeScript em todos os workspaces                                |
| `npm test`                                    | testes unitários e de integração de todos os workspaces          |
| `npm run test:e2e`                            | a API por HTTP contra um Postgres de verdade (embutido)          |
| `npm run contrast`                            | contraste WCAG de cada token de texto, nos dois temas e cada cor |
| `npm run api:openapi`                         | escreve `apps/api/openapi.json` a partir do código               |
| `npm run api:client`                          | regenera `packages/api-client/src/gen` a partir dele             |
| `npm run db:generate -- --name <nome>`        | uma migration a partir da diferença do schema                    |
| `npm run db:migrate` / `db:studio`            | aplica as migrations em `DATABASE_URL` / abre o Drizzle Studio   |
| `npm run screenshots -w web`                  | fotos de todas as telas (com a API e o preview rodando)          |

## Estrutura

```
apps/
  api/            NestJS + Drizzle: core, identity, notes (exemplo), infra, HTTP, testes, export do OpenAPI
  web/            export estático do Next.js: shell, telas de autenticação, notas, galeria de gráficos, ajustes
  landing/        export estático do Next.js: a página do produto em pt-BR, en e es
packages/
  ui/             design system: tokens, primitivos, gráficos, store da aparência, checagem de contraste
  api-client/     cliente Orval + mutator de fetch (renova e repete, Web Locks entre abas)
  utils/          cn, dinheiro, números, datas
  config/         presets de ESLint, TypeScript e Prettier
docs/
  business-rules.md   as regras numeradas do produto: o contrato
  patterns/           como o código é escrito (API e front), um documento curto por assunto
.claude/skills/       skills do projeto para o Claude Code
```

Cada workspace e a raiz têm um `CLAUDE.md` com as convenções.

## Como as peças se encaixam

1. Uma regra é escrita em `docs/business-rules.md`, implementada e testada na API (`apps/api/src/domain`).
2. O endpoint se documenta para o OpenAPI; `npm run api:openapi` exporta o documento.
3. `npm run api:client` transforma o documento em funções tipadas em `@workspace/api-client`.
4. O app web as chama pelo TanStack Query; o cliente renova a sessão sozinho (um 401 renova uma vez, e só uma aba
   renova por vez).
5. As telas são montadas com `@workspace/ui`, cujos tokens seguem o visual que cada pessoa escolhe (salvo na conta).

## Deixando com a sua cara

Rode a skill `rename-project` no Claude Code, ou faça à mão:

1. Nomes: `package.json`, `apps/web/config/site.ts`, `apps/landing/config/site.ts`, `APP_NAME` em
   `apps/api/src/infra/env/env.ts` e `.env.example` (o nome do produto nos e-mails, no banner de boot e no título do
   OpenAPI).
2. Textos da landing: os dicionários em `apps/landing/i18n/dictionaries/` (um por idioma; para incluir ou tirar um
   idioma, veja `docs/patterns/web/i18n.md`).
3. Chaves: o cookie de renovação (`apps/api/src/presentations/http/auth/refresh-transport.ts`), as chaves de
   armazenamento da aparência e da barra lateral (`packages/ui`), o nome do Web Lock (`packages/api-client`), a chave
   de sessão do seletor de idioma (`apps/landing`).
4. Visual: os valores de `packages/ui/src/styles/tokens.css`, as fontes dos layouts raiz, `app/icon.svg` e
   `components/shell/brand.tsx`; depois `npm run contrast`.
5. O exemplo: mantenha o contexto `notes` como referência até existir o primeiro contexto de verdade, depois remova (a
   skill lista cada arquivo).

## Convenções

- Conventional Commits (`feat(api): …`, `fix(web): …`), conferidos em todo commit; o lint-staged formata e passa o
  lint nos arquivos em stage de cada workspace.
- Versões exatas nas dependências.
- Código e documentação em inglês (este README tem também uma [versão em inglês](./README.en.md)); os textos da
  landing ficam nos dicionários dela, um por idioma.

## Licença

MIT, veja [LICENSE](./LICENSE).
