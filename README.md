# **<div align="center">Vue 3 Router - Get Matched Components</div>**

<div align="center">
  <p>List components that are going to enter, leave or stay on the page after navigation</p>
</div>

## Instalation

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

const router = createRouter({
  /* routes */
});

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
