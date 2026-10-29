# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run start:dev` — run with watch mode (there is no `dev` script). `npm start` runs once; `npm run start:prod` runs `dist/main` (build first).
- `npm run build` — `nest build` (also what the Swagger plugin hooks into, see below).
- `npm run lint` — oxlint over `src/` and `test/`. `npm run format` — prettier.
- `npm test` — vitest (not jest). Single file: `npx vitest run src/tasks/tasks.service.filter.spec.ts`; single test: add `-t "test name"`.
- `npm run test:e2e` — uses `vitest.config.e2e.ts` and `*.e2e-spec.ts` files (`test/` is currently empty).

Needs PostgreSQL; copy `.env.example` to `.env` (`DB_*`, `JWT_SECRET`). `main.ts` loads it via `dotenv/config`. Swagger UI is at `/api`.

## Architecture

NestJS 11 app, ESM (`"type": "module"`), TypeORM on Postgres. Relative imports must use the `.js` extension (e.g. `./tasks.service.js`) even though the sources are `.ts`.

- `AppModule` configures TypeORM with `autoLoadEntities: true` and `synchronize: true`, so schema changes come from entity edits with no migrations. Entities register through each module's `TypeOrmModule.forFeature`.
- **Auth module** (`src/auth`) holds both auth and user management: `AuthController` (`POST /auth/login`), `UsersController` (`/users`, including `GET /users/me`) and `JwtStrategy`. JWT payload is `{ sub, username, role }` (`JwtPayload`); `sub` is the user id. `GET /users/me` must stay declared above `GET /users/:id`. `User.password` is `select: false` and bcrypt-hashed; `UsersService` explicitly selects safe columns.
- **Admins** live in a separate `admins` table (`Admin` entity), log in via `POST /auth/admin/login`, and are the only source of `role: 'ADMIN'` tokens. `POST /auth/login` always issues `role: 'USER'` (the `users.role` column is no longer used for auth). Admin and user ids can collide, so user-scoped routes (`/tasks`, `/users/me`) require `@Roles(Role.USER)` with `RolesGuard`; admin routes (`/admin/tasks`) use `AdminAuthGuard` (accepts a Bearer JWT or HTTP Basic admin credentials) plus `RolesGuard` with `Role.ADMIN`. `AdminSeedService` seeds `ADMIN_USERNAME`/`ADMIN_PASSWORD` (default `admin` / `admin$123`) on startup if missing.
- **Tasks module** (`src/tasks`) is guarded by `JwtAuthGuard` at the controller level. Tasks are scoped per user: controllers pass `request.user.sub` into the service, and every query filters by `userId`. Keep that scoping on any new task query.
- Global setup in `main.ts`: `ValidationPipe` (`whitelist`, `transform`) and `TransformInterceptor`, which wraps every successful response as `{ statusCode, message: 'Success', data }`.
- **Swagger**: the `@nestjs/swagger` CLI plugin is enabled in `nest-cli.json`, which documents `*.dto.ts` properties from class-validator decorators at `nest build` / `nest start` time. Don't add `@ApiProperty` by hand. Controllers use `@ApiTags`/`@ApiOperation`, and protected routes use `@ApiBearerAuth('access-token')`.

## Testing notes

Specs that instantiate a controller or service through `Test.createTestingModule` must mock the injected pieces: `getRepositoryToken(Entity)` for repositories and `.overrideGuard(JwtAuthGuard)` for guarded controllers. `vitest` globals are enabled.

## Deployment

Multi-stage `Dockerfile` (node 22) builds to `dist` and runs `node dist/main.js` on port 3000; `cloudbuild.yaml` builds and pushes the image to Artifact Registry.
