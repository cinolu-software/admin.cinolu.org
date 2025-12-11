# Cinolu Client (Angular)

This repository contains the Angular client application for the Cinolu project. It's an Angular 20-based app with server-side rendering (SSR) support and a set of developer scripts and tools configured for linting, formatting, and testing.

## Table of contents

- About
- Requirements
- Setup
- Development
- Building
- Server-side rendering (SSR)
- Linting & Formatting
- Project structure
- Contributing
- License

## About

The client is a modern Angular application that serves the website UI. It uses Angular 20, PrimeNG for UI components, Tailwind utilities, and supports SSR using the Angular SSR tooling and an Express server entrypoint.

## Requirements

- Node.js (recommended LTS — v18+ or later)
- pnpm (the repository uses pnpm workspace; if you prefer npm or yarn, adapt commands accordingly)
- A modern browser for development

## Setup

1. Install dependencies (pnpm is recommended):

```bash
pnpm install
```

2. Ensure Husky hooks are set up (this runs automatically on `pnpm install` via the `prepare` script):

```bash
pnpm -s prepare
```

## Development

- Start the dev server with live reload:

```bash
pnpm dev
```

- Build in watch mode for iterative builds (useful for debugging builds or running a separate server):

```bash
pnpm watch
```

## Building for production

Build the client app (AOT compilation enabled):

```bash
pnpm build
```

The built artifacts will be placed under `dist/app` (see `angular.json` output settings). The production build uses optimizations and output hashing.

## Server-side rendering (SSR)

This project is configured for SSR. The `ssr` script runs the compiled server bundle produced by the Angular SSR build.

- To build SSR and server bundle, run the standard Angular build with server options. Example (CLI):

```bash
pnpm ng run app:build:production
```

After building for SSR, start the server bundle:

```bash
pnpm ssr
```

Note: `ssr` runs `node dist/app/server/server.mjs` — ensure the server bundle exists after your build.

## Linting & Formatting

- Lint the codebase:

```bash
pnpm lint
```

- Format source files with Prettier (configured for TS and HTML files under `src`):

```bash
pnpm format
```

## Useful scripts (from package.json)

- `pnpm dev` — start Angular dev server (`ng serve`)
- `pnpm build` — production build (`ng build --aot`)
- `pnpm watch` — build in watch mode (`ng build --watch --configuration development`)
- `pnpm test` — run unit tests
- `pnpm ssr` — run compiled SSR server bundle (`node dist/app/server/server.mjs`)
- `pnpm lint` — lint files with ESLint
- `pnpm format` — format code with Prettier

## Project structure (high level)

- `src/` — application source
  - `app/` — main application folder (modules, features, shared)
  - `environments/` — environment configs
  - `main.ts` and `main.server.ts` — client and server entry points
  - `server.ts` — Node/Express server used for SSR
- `public/` — static assets copied into the build output
- `dist/` — build output (generated)

## Environment files

Use the `environments` folder for environment-specific settings. During development the `development` file is swapped in via the `angular.json` configuration.

## Contributing

Thanks for helping improve the project! A few guidelines:

- Follow existing code style and run `pnpm format` before committing.
- Run `pnpm lint` and `pnpm test` to catch issues early.
- Write clear commit messages. Commitlint is configured in this repository.

If you'd like a contributor guide, tests, or CI configuration added, open an issue or submit a PR with a proposed change.

## License

Add your license here (e.g., MIT). If the repository has an organizational license file in the root, the client inherits that license.
