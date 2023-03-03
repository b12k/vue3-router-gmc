# **<div align="center">Vue 3 Router - Get Matched Components</div>**

<div align="center">
  <p>List components that are going enter, leave or stay after navigation</p>
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
    entering, // array of components entering the view
    leaving, // array of components leaving the view
    staying, // array of components staying in the view
  } = await getMatchedComponents(to, from);
});
```

## Real world example

This lib is used in [The Boilerplate Vue](https://github.com/b12k/the-boilerplate-vue) 👉 [HERE](https://github.com/b12k/the-boilerplate-vue/blob/master/src/client/router/exec-route-pre-fetch.ts#L12)
