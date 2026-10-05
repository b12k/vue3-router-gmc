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
  const [groupsTo, groupsFrom] = await Promise.all([
    Promise.all(to.matched.map((record) => resolveComponents(record))),
    Promise.all(
      (from?.matched ?? []).map((record) => resolveComponents(record)),
    ),
  ]);
  const componentsTo = groupsTo.flat();
  const componentsFrom = groupsFrom.flat();

  const staying: Array<DefineComponent> = [];
  const entering = componentsTo.filter((component) => {
    const isStaying = componentsFrom.includes(component);
    if (isStaying) staying.push(component);
    return !isStaying;
  });
  const leaving = componentsFrom.filter(
    (component) => !staying.includes(component),
  );

  return { entering, leaving, staying };
};
