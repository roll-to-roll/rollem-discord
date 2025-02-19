import { ReflectiveInjector, Provider, InjectionToken, Type, FactoryProvider, ClassProvider, ExistingProvider, TypeProvider, ValueProvider, ResolvedReflectiveProvider, Injector, ReflectiveKey } from "injection-js";
import { Newable } from "@common/util/types/utility-types";
import { InjectionError } from "injection-js/reflective_errors"
import { has, hasIn, keys, keysIn } from "lodash";
import { strict } from "assert";

export interface IInitializeable {
  initialize(): Promise<void>;
}

const INITIALIZEABLES = new InjectionToken<IInitializeable>("Initializeable object")

/** A utility wrapper around @see ReflectiveInjector */
export class InjectorWrapper {
  private _isInitialized: boolean = false;
  public get isInitialized(): boolean { return this._isInitialized; }

  constructor(
    /** The originating injector. */
    public readonly injector: ReflectiveInjector,

    private readonly allResolved: ResolvedReflectiveProvider[],

    /** The parent context. */
    public readonly parent?: InjectorWrapper
  ) { }

  /** Initializes this {@link InjectorWrapper} and then returns itself.*/
  public async initialize(): Promise<InjectorWrapper> {
    if (this._isInitialized) { return this; }

    const initializeables = this.get<IInitializeable[]>(INITIALIZEABLES).flat();

    console.debug("Initializing...", initializeables.map(i => i.constructor.name));

    const promises = initializeables.map(async i => {
      await i.initialize();
      console.debug("...Initialized", [i.constructor.name]);
    });
    await Promise.all(promises);
    
    this._isInitialized = true;
    return this;
  }

  public validateAllOrThrow(): InjectorWrapper {
    const errors: { token: unknown, message: string }[] = [];
    for (const resolvedProvider of this.allResolved) {
      try {
        this.injector.get(resolvedProvider.key.token);
      } catch (ex) {
        const error = ex as InjectionError;
        errors.push({ token: resolvedProvider.key.token, message: error.message });
        console.debug(resolvedProvider.key.token, error.message);
      }
    }

    if (errors.length > 0) throw new Error("DI Validation Failures", { cause: errors });
    return this;
  }

  /** Gets a value for the given context. */
  public get<T>(ctor: Newable<T> | InjectionToken<T>) {
    return this.injector.get(ctor) as T;
  }

  /** Creates a child context, inheriting from a parent context, with additional providers. */
  public createChildContext(newProviders: RollemProvider[]): InjectorWrapper {
    const resolved = InjectorWrapper.resolveProvidersWithExtras(newProviders);
    const newInjector = this.injector.createChildFromResolved(resolved);
    return new InjectorWrapper(newInjector, resolved, this);
  }

  /** Creates a new Top Level Context out of a complete set of providers. */
  public static createTopLevelContext(providers: RollemProvider[]): InjectorWrapper {
    const resolved = InjectorWrapper.resolveProvidersWithExtras(providers);
    return new InjectorWrapper(ReflectiveInjector.fromResolvedProviders(resolved), resolved);
  }

  public static resolveProvidersWithExtras(providers: RollemProvider[]): ResolvedReflectiveProvider[] {
    const resolved = ReflectiveInjector.resolve(providers);
    const hasInitialize = resolved.map(r => r.key).filter(k => hasIn((k.token as Type).prototype, 'initialize'));
    const initializerFactories = hasInitialize.map(k => { return { provide: INITIALIZEABLES, useFactory: e => e, deps: [k.token], multi: true}; });
    const andInitializerLocators = ReflectiveInjector.resolve(initializerFactories);
    return [...resolved, ...andInitializerLocators];
  }
}

/** The default {@link Provider} definition includes `any`, which this removes. */
export type RollemProvider = TypeProvider | ValueProvider | ClassProvider | ExistingProvider | FactoryProvider;

// somehow these didn't work...
// export interface RollemTypeProvider<TProvidedType> extends Type<TProvidedType> {
// }

// export interface RollemValueProvider<ProvidedType, UsingType extends ProvidedType> {
//     provide: ProvidedType;
//     useValue: UsingType;
//     multi?: boolean;
// }

// export interface RollemClassProvider<ProvidedType, UsingType extends ProvidedType> {
//     provide: ProvidedType;
//     useClass: Type<UsingType>;
//     multi?: boolean;
// }

// export interface RollemExistingProvider<ProvidedType, UsingType extends ProvidedType> {
//     provide: ProvidedType;
//     useExisting: UsingType;
//     multi?: boolean;
// }

// export type MysteryTuple<T1 = void, T2 = void, T3 = void, T4 = void, T5 = void> = [T1] | [T1,T2] | [T1, T2, T3] | [T1, T2, T3, T4] | [T1, T2, T3, T4, T5]

// export interface RollemFactoryProvider<
//   ProvidedType,
//   UsingType extends ProvidedType,
//   T1 = void, T2 = void, T3 = void, T4 = void, T5 = void
//   > {
//     provide: ProvidedType;
//     useFactory: (...t: MysteryTuple<T1,T2,T3,T4,T5>) => UsingType;
//     deps?: MysteryTuple<T1,T2,T3,T4,T5>;
//     multi?: boolean;
// }

// export type AnyRollemProvider<
//   ProvidedType, UsingType extends ProvidedType,
//   T1 = void, T2 = void, T3 = void, T4 = void, T5 = void>
//   = RollemValueProvider<ProvidedType, UsingType>
//   | RollemClassProvider<ProvidedType, UsingType>
//   | RollemExistingProvider<ProvidedType, UsingType>
//   | RollemFactoryProvider<ProvidedType, UsingType, T1, T2, T3, T4, T5>
//   | RollemTypeProvider<UsingType>;


// export type AnyRollemProviderObject<T> = {
//   [P in keyof T]: T[P] extends (RollemTypeProvider<T[P]>);
// }