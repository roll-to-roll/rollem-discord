import { ReflectiveInjector, Provider, InjectionToken } from "injection-js";
import { Newable } from "@root/platform/discord/rollem-bot/lib/utility-types";

/** A utility wrapper around @see ReflectiveInjector */
export class InjectorWrapper {
  constructor(
    /** The originating injector. */
    public readonly injector: ReflectiveInjector,

    /** The parent context. */
    public readonly parent?: InjectorWrapper
  ) { }

  /** Gets a value for the given context. */
  public get<T>(ctor: Newable<T> | InjectionToken<T>)
  {
    return this.injector.get(ctor) as T;
  }

  /** Creates a child context, inheriting from a parent context, with additional providers. */
  public createChildContext(newProviders: Provider[]) {
    const newInjector =
      this.injector.resolveAndCreateChild(newProviders);

    return new InjectorWrapper(newInjector, this);
  }

  /** Creates a new Top Level Context out of a complete set of providers. */
  public static createTopLevelContext(providers: Provider[]) {
    return new InjectorWrapper(ReflectiveInjector.resolveAndCreate(providers));
  }
}