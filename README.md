# **<div align="center">Vue 3 Router - Get Matched Components</div>**

<div align="center">
  <p>List components that are going to enter, leave or stay on the page after navigation</p>
</div>

## Installation

npm

```shell
npm i @b12k/vue3-router-gmc
```

yarn

```shell
yarn add @b12k/vue3-router-gmc
```

pnpm

```shell
pnpm add @b12k/vue3-router-gmc
```

## Usage

```typescript
import { getMatchedComponents } from '@b12k/vue3-router-gmc';
import { createRouter } from 'vue-router';

const router = createRouter({/* routes */});

router.beforeEach(async (to, from) => {
  const {
    entering, // array of components entering the page
    leaving, // array of components leaving the page
    staying, // array of components staying on the page
  } = await getMatchedComponents(to, from);
});
```

💡 Also works with `beforeResolve` guard.

## Real world example

This lib is used in [The Boilerplate Vue](https://github.com/b12k/the-boilerplate-vue) 👉 [HERE](https://github.com/b12k/the-boilerplate-vue/blob/master/src/client/router/exec-route-pre-fetch.ts#L12)

## Behavior

Only components of matched route records and named views are returned. Local
component registrations are not traversed. Components are compared by definition
identity; using the same definition on both routes reports it as staying.

Lazy loaders may return a component directly or a module with a default export.
Successful loads are cached on the route record, so Vue Router uses the same
component without loading it again. Concurrent calls share pending loads within
the same record and named view. Failed loads propagate their error and can be retried.

Functional components must have a `displayName` or `props` property, as required
by Vue Router to distinguish them from lazy loaders.

## Development

Use Node.js 26 (`.nvmrc`) and the pnpm version pinned in `packageManager`.
The package targets the current Vue and Vue Router major versions and ships ESM and CommonJS.

- `pnpm dev` watches the library and declarations with Rslib.
- `pnpm build` creates ESM and CJS bundles with separate declarations with Rslib.
- `pnpm test` runs Rstest regression tests, including real Vue Router integration.
- `pnpm test:types` checks the built public declarations for both import and require.
- `pnpm lint` checks types, type-aware Oxlint rules, and Oxfmt formatting.
