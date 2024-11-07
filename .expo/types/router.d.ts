/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/home` | `/(tabs)/profile` | `/(tabs)/tasks` | `/_sitemap` | `/add-chore` | `/add-house` | `/home` | `/login` | `/profile` | `/signup` | `/tasks`;
      DynamicRoutes: `/task-info/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/task-info/[id]`;
    }
  }
}
