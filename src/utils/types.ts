export type CustomHtmlElement = React.ElementType<
  React.HTMLAttributes<HTMLElement>
>;

export declare type DeepImmutable<T> = T extends (...args: any[]) => any
  ? T
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<DeepImmutable<K>, DeepImmutable<V>>
    : T extends Set<infer S>
      ? ReadonlySet<DeepImmutable<S>>
      : T extends object
        ? { readonly [K in keyof T]: DeepImmutable<T[K]> }
        : T;

export function freeze<T>(value: T): DeepImmutable<T> {
  return value as DeepImmutable<T>;
}
