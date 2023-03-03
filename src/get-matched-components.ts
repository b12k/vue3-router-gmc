import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router';

import type { DefineComponent } from 'vue';

import { resolveComponents } from './resolve-components';

export const getMatchedComponents = async (
  to: RouteLocationNormalized,
  from?: RouteLocationNormalizedLoaded,
) => {
  const toPromises = to.matched.map((route) =>
    resolveComponents(route.components),
  );
  const fromPromises = from
    ? from.matched.map((route) => resolveComponents(route.components))
    : [];

  const [componentsTo, componentsFrom] = await Promise.all([
    ...toPromises,
    ...fromPromises,
  ]);

  const staying: Array<DefineComponent> = [];
  const entering: Array<DefineComponent> = componentsTo.filter((component) => {
    const isStaying = (componentsFrom || []).includes(component);
    if (isStaying) staying.push(component);
    return !isStaying;
  });
  const leaving = (componentsFrom || []).filter(
    (component) => !staying.includes(component),
  );

  return {
    entering,
    leaving,
    staying,
  };
};
