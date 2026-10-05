import type { RouteComponent, RouteRecordNormalized } from 'vue-router';
import type { DefineComponent } from 'vue';

type ComponentImport = RouteComponent | { default: RouteComponent };
type ImportFunction = () => Promise<ComponentImport>;

interface PendingImport {
  load: ImportFunction;
  promise: Promise<ComponentImport>;
}

const pendingImports = new WeakMap<
  RouteRecordNormalized,
  Map<string, PendingImport>
>();

function checkIsRouteComponent(
  component: unknown,
): component is RouteComponent {
  return (
    (typeof component === 'object' && component !== null) ||
    (typeof component === 'function' &&
      ('displayName' in component ||
        'props' in component ||
        '__vccOpts' in component))
  );
}

function checkIsModule(
  imported: ComponentImport,
): imported is { default: RouteComponent } {
  return (
    typeof imported === 'object' &&
    imported !== null &&
    (Boolean('__esModule' in imported && imported.__esModule) ||
      Reflect.get(imported, Symbol.toStringTag) === 'Module' ||
      ('default' in imported && checkIsRouteComponent(imported.default)))
  );
}

export const resolveComponents = async (
  record: RouteRecordNormalized,
): Promise<Array<DefineComponent>> => {
  const entries = record.components;
  if (!entries) return [];

  const importsByName =
    pendingImports.get(record) ?? new Map<string, PendingImport>();
  pendingImports.set(record, importsByName);

  return Promise.all(
    Object.entries(entries).map(async ([name, entry]) => {
      if (checkIsRouteComponent(entry)) return entry as DefineComponent;
      if (typeof entry !== 'function') {
        throw new Error('Invalid route component "' + name + '"');
      }

      const load = entry as ImportFunction;
      const previous = importsByName.get(name);
      const pending =
        previous?.load === load
          ? previous.promise
          : Promise.resolve().then(load);
      importsByName.set(name, { load, promise: pending });
      try {
        const imported = await pending;
        const component = checkIsModule(imported) ? imported.default : imported;
        if (!checkIsRouteComponent(component)) {
          throw new Error('Cannot resolve route component "' + name + '"');
        }

        if (entries[name] === entry) {
          record.mods[name] = imported;
          entries[name] = component;
        }
        return component as DefineComponent;
      } finally {
        if (importsByName.get(name)?.promise === pending) {
          importsByName.delete(name);
        }
      }
    }),
  );
};
