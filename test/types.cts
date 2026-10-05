import type { DefineComponent } from 'vue';
import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router';
import { getMatchedComponents } from '@b12k/vue3-router-gmc';

declare const to: RouteLocationNormalized;
declare const from: RouteLocationNormalizedLoaded;
const initial: Promise<{
  entering: DefineComponent[];
  leaving: DefineComponent[];
  staying: DefineComponent[];
}> = getMatchedComponents(to);
const navigation: typeof initial = getMatchedComponents(to, from);
void initial;
void navigation;
// @ts-expect-error A route is required.
void getMatchedComponents();
// @ts-expect-error A path is not a normalized route.
void getMatchedComponents('/');
