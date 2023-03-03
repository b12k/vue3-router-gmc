# **<div align="center">Vue3 Router - Get Matched Components</div>**

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
pnmp add @b12k/vue3-router-gmc
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

## Usage example

This lib is used in
