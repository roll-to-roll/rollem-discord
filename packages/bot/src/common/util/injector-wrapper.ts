import { ReflectiveInjector, Provider, InjectionToken, Type } from "injection-js";
import { Newable } from "@common/util/types/utility-types";

/** A utility wrapper around @see ReflectiveInjector */
export class InjectorWrapper {
  constructor(
    /** The originating injector. */
    public readonly injector: ReflectiveInjector,

    /** The parent context. */
    public readonly parent?: InjectorWrapper
  ) { }

  /** Gets a value for the given context. */
  public get<T>(ctor: Newable<T> | InjectionToken<T>) {
    return this.injector.get(ctor) as T;
  }

  /** Creates a child context, inheriting from a parent context, with additional providers. */
  public createChildContext(newProviders: RollemProvider[]): InjectorWrapper {
    const newInjector = this.injector.resolveAndCreateChild(newProviders);
    return new InjectorWrapper(newInjector, this);
  }

  /** Creates a new Top Level Context out of a complete set of providers. */
  public static createTopLevelContext(providers: RollemProvider[]): InjectorWrapper {
    return new InjectorWrapper(ReflectiveInjector.resolveAndCreate(providers));
  }
}


export interface RollemTypeProvider extends Type<any> {
}

export interface RollemValueProvider {
    provide: any;
    useValue: any;
    multi?: boolean;
}

export interface RollemClassProvider {
    provide: any;
    useClass: Type<any>;
    multi?: boolean;
}

export interface RollemExistingProvider {
    provide: any;
    useExisting: any;
    multi?: boolean;
}

export interface RollemFactoryProvider {
    provide: any;
    useFactory: Function;
    deps?: any[];
    multi?: boolean;
}

export declare type RollemProvider = RollemTypeProvider | RollemValueProvider | RollemClassProvider | RollemExistingProvider | RollemFactoryProvider;
