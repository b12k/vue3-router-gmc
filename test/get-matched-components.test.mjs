import assert from 'node:assert/strict';
import { test } from '@rstest/core';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { getMatchedComponents } from '../src/index.ts';

function createPage(name) {
  return { name, render() {} };
}
function createRoute(...components) {
  return {
    meta: {},
    matched: components.map((component) => ({
      components: component && { default: component },
      mods: {},
    })),
  };
}
function getNames(components) {
  return components.map((component) => component.name || component.displayName);
}

test('flat route', async () => {
  const result = await getMatchedComponents(createRoute(createPage('Page')));
  assert.deepEqual(getNames(result.entering), ['Page']);
  assert.deepEqual(result.leaving, []);
  assert.deepEqual(result.staying, []);
});
test('initial nested layout and page', async () => {
  const result = await getMatchedComponents(
    createRoute(createPage('Layout'), createPage('Page')),
  );
  assert.deepEqual(getNames(result.entering), ['Layout', 'Page']);
  assert.deepEqual(result.leaving, []);
});
test('nested child under a componentless parent', async () => {
  const result = await getMatchedComponents(
    createRoute(undefined, createPage('Page')),
  );
  assert.deepEqual(getNames(result.entering), ['Page']);
  assert.deepEqual(result.leaving, []);
});
test('sibling pages under a shared layout', async () => {
  const layout = createPage('Layout');
  const result = await getMatchedComponents(
    createRoute(layout, createPage('Next')),
    createRoute(layout, createPage('Previous')),
  );
  assert.deepEqual(getNames(result.entering), ['Next']);
  assert.deepEqual(getNames(result.leaving), ['Previous']);
  assert.deepEqual(getNames(result.staying), ['Layout']);
});
test('all previous nested records leave on a flat navigation', async () => {
  const result = await getMatchedComponents(
    createRoute(createPage('Next')),
    createRoute(createPage('Layout'), createPage('Previous')),
  );
  assert.deepEqual(getNames(result.leaving), ['Layout', 'Previous']);
});
test('empty target without a previous route', async () => {
  assert.deepEqual(await getMatchedComponents(createRoute()), {
    entering: [],
    leaving: [],
    staying: [],
  });
});
test('empty target still reports the previous page as leaving', async () => {
  const result = await getMatchedComponents(
    createRoute(),
    createRoute(createPage('Previous')),
  );
  assert.deepEqual(result.entering, []);
  assert.deepEqual(getNames(result.leaving), ['Previous']);
});
test('registered components are not matched route components', async () => {
  let imports = 0;
  const parent = createPage('Page');
  parent.components = {
    Unused: async () => {
      imports += 1;
      return { default: createPage('Unused') };
    },
  };
  const result = await getMatchedComponents(createRoute(parent));
  assert.deepEqual(getNames(result.entering), ['Page']);
  assert.equal(imports, 0);
});
test('a recursive component registry must not be traversed', async () => {
  const recursive = createPage('Recursive');
  let reads = 0;
  Object.defineProperty(recursive, 'components', {
    get() {
      reads += 1;
      if (reads > 8)
        throw new Error('Unbounded registry recursion: ' + reads + ' reads');
      return { Self: recursive };
    },
  });
  const result = await getMatchedComponents(createRoute(recursive));
  assert.deepEqual(result.entering, [recursive]);
  assert.equal(reads, 0);
});
test('functional components with displayName are not invoked as loaders', async () => {
  let renders = 0;
  function Functional() {
    renders += 1;
    return h('p', 'functional page');
  }
  Functional.displayName = 'Functional';
  const result = await getMatchedComponents(createRoute(Functional));
  assert.deepEqual(result.entering, [Functional]);
  assert.equal(renders, 0);
});
test('component constructors with __vccOpts are not invoked as loaders', async () => {
  class ComponentClass {}
  ComponentClass.__vccOpts = createPage('ClassPage');
  const result = await getMatchedComponents(createRoute(ComponentClass));
  assert.deepEqual(result.entering, [ComponentClass]);
});
test('lazy loader may return a component directly', async () => {
  const component = createPage('Page');
  const result = await getMatchedComponents(createRoute(async () => component));
  assert.deepEqual(result.entering, [component]);
});
test('lazy loader may return an ES module with a default component', async () => {
  const component = createPage('Page');
  const result = await getMatchedComponents(
    createRoute(async () => ({ default: component })),
  );
  assert.deepEqual(result.entering, [component]);
});
test('named-view order is preserved when mixing loaded and lazy views', async () => {
  const primary = createPage('Primary');
  const sidebar = createPage('Sidebar');
  const target = {
    meta: {},
    matched: [
      {
        mods: {},
        components: {
          default: async () => ({ default: primary }),
          sidebar,
        },
      },
    ],
  };
  assert.deepEqual((await getMatchedComponents(target)).entering, [
    primary,
    sidebar,
  ]);
});
test('a lazy loader rejection propagates unchanged', async () => {
  const failure = new Error('lazy module failed');
  await assert.rejects(
    getMatchedComponents(
      createRoute(async () => {
        throw failure;
      }),
    ),
    (error) => error === failure,
  );
});
test('real Vue Router does not repeat a loader already resolved by the helper', async () => {
  let imports = 0;
  let observed;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: async () => ({ default: createPage('Page' + ++imports) }),
      },
    ],
  });
  router.beforeEach(async (to, from) => {
    observed = (await getMatchedComponents(to, from)).entering[0];
  });
  await router.push('/');
  assert.equal(
    imports,
    1,
    'helper plus router invoked the loader ' + imports + ' times',
  );
  assert.equal(
    observed,
    router.currentRoute.value.matched[0].components.default,
  );
});
test('concurrent calls reuse the same in-flight route loader', async () => {
  let imports = 0;
  const component = createPage('Page');
  const target = createRoute(async () => {
    imports += 1;
    await Promise.resolve();
    return { default: component };
  });
  const [first, second] = await Promise.all([
    getMatchedComponents(target),
    getMatchedComponents(target),
  ]);
  assert.equal(imports, 1);
  assert.deepEqual(first.entering, [component]);
  assert.deepEqual(second.entering, [component]);
});
test('different route records keep independent lazy factories', async () => {
  let imports = 0;
  const load = async () => ({ default: createPage('Page' + ++imports) });
  const [first, second] = await Promise.all([
    getMatchedComponents(createRoute(load)),
    getMatchedComponents(createRoute(load)),
  ]);
  assert.equal(imports, 2);
  assert.notEqual(first.entering[0], second.entering[0]);
});
test('different named views keep independent lazy factories', async () => {
  let imports = 0;
  const load = async () => ({ default: createPage('Page' + ++imports) });
  const target = {
    meta: {},
    matched: [{ components: { default: load, sidebar: load }, mods: {} }],
  };
  const result = await getMatchedComponents(target);
  assert.equal(imports, 2);
  assert.notEqual(result.entering[0], result.entering[1]);
});
test('a failed loader can be retried', async () => {
  let imports = 0;
  const failure = new Error('transient failure');
  const component = createPage('Page');
  const target = createRoute(async () => {
    if (++imports === 1) throw failure;
    return { default: component };
  });
  await assert.rejects(
    getMatchedComponents(target),
    (error) => error === failure,
  );
  assert.deepEqual((await getMatchedComponents(target)).entering, [component]);
  assert.equal(imports, 2);
});

test('a replaced loader cannot be overwritten by its previous pending result', async () => {
  const previous = createPage('Previous');
  const next = createPage('Next');
  let complete;
  const target = createRoute(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const pending = getMatchedComponents(target);
  await Promise.resolve();
  target.matched[0].components.default = async () => next;
  assert.deepEqual((await getMatchedComponents(target)).entering, [next]);
  complete(previous);
  assert.deepEqual((await pending).entering, [previous]);
  assert.equal(target.matched[0].components.default, next);
});

test('invalid lazy results fail without caching the failed result', async () => {
  let imports = 0;
  const target = createRoute(async () => {
    imports += 1;
    return undefined;
  });
  await assert.rejects(
    getMatchedComponents(target),
    /Cannot resolve route component/,
  );
  await assert.rejects(
    getMatchedComponents(target),
    /Cannot resolve route component/,
  );
  assert.equal(imports, 2);
});

test('a shared pending record in to and from is resolved once and stays', async () => {
  let imports = 0;
  const component = createPage('Page');
  const target = createRoute(async () => {
    imports += 1;
    return component;
  });
  assert.deepEqual(await getMatchedComponents(target, target), {
    entering: [],
    leaving: [],
    staying: [component],
  });
  assert.equal(imports, 1);
});

test('Router module metadata retains the original lazy module', async () => {
  const component = createPage('Page');
  const module = { default: component, extra: 'metadata' };
  const target = createRoute(async () => module);
  await getMatchedComponents(target);
  assert.equal(target.matched[0].mods.default, module);
});
