import type { RouteRecordNormalized } from 'vue-router';

import type { DefineComponent } from 'vue';

type ImportFunction = () => Promise<{
  default: DefineComponent;
}>;

export const resolveComponents = async (
  entries: RouteRecordNormalized['components'],
) => {
  if (!entries) return [];

  const { loaded, imports } = Object.values(entries).reduce<{
    loaded: Array<DefineComponent>;
    imports: Array<ImportFunction>;
  }>(
    (acc, next) => {
      if (typeof next === 'function') {
        acc.imports.push(next as ImportFunction);
      } else {
        acc.loaded.push(next as DefineComponent);
      }
      return acc;
    },
    {
      loaded: [],
      imports: [],
    },
  );
  const importPromises = imports.map((index) => index());
  const importResults = await Promise.all(importPromises);
  const imported = importResults.map((index) => index.default);
  const components: Array<DefineComponent> = [...loaded, ...imported];

  const nestedImportsResult = await Promise.all(
    components.map(({ components: nestedComponents }) =>
      resolveComponents(nestedComponents),
    ),
  );

  const nestedComponents: Array<DefineComponent> = nestedImportsResult.flat();

  return [...components, ...nestedComponents];
};
