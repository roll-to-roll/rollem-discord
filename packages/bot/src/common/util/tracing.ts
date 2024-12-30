
import { default as callsitesApi, CallSite } from 'callsites';
import { chain, Dictionary, first, find } from 'lodash';

/** Options for evaluating Callsite Records. */
export interface CallsiteOptions {
  /** The number of initial entries to skip. */
  skip: number,
}

/** A concrete callsite record. */
export type CallsiteRecord = {
  [T in keyof Omit<CallSite, 'constructor'>]: ReturnType<CallSite[T]>;
}

export class WrappedCallsite {
  constructor(
    /** The callsite. */
    public readonly cs: CallSite,

    /** The computed record. */
    public readonly csr: CallsiteRecord,
  ) { }

  /**
   * Gets a class identifier, if it could be found.
   * skipping layers that are not useful (like node_modules/opentelemetry).
   * Otherwise undefined.
   */
  public get classId(): string | undefined {
    if (this.isNode) { return undefined; }
    if (this.isOpenTelemetry) {
      return undefined;
    }

    return this.anyClassId;
  }

  /** Gets the class identifier, if it could be found. Otherwise undefined. */
  public get anyClassId(): string | undefined {
    if (this.csr.isConstructor) {
      return `${this.csr.getFunctionName}.ctor`;
    }

    if (!!this.csr.getMethodName) {
      if (!!this.csr.getTypeName) {
        return `${this.csr.getTypeName}.${this.csr.getMethodName}`;
      }
    }

    return undefined;
  }

  /** Attempts to produces a readable caller name. */
  public get name(): string | undefined {
    if (this.csr.isConstructor) {
      return `${this.csr.getFunctionName}.ctor`;
    }

    if (!!this.csr.getMethodName) {
      if (!!this.csr.getTypeName) {
        return `${this.csr.getTypeName}.${this.csr.getMethodName}`;
      }
    }

    if (this.csr.isToplevel) {
      return `[TOP_LEVEL] ${this.csr.getFunctionName}`
    }

    return undefined;
  }

  /** Returns true if the path looks like it's from node_modules. */
  public get isNode(): boolean {
    return this.csr.getFileName?.startsWith("node:") ?? false;
  }

  /** Returns true if the path looks like it's from node_modules. */
  public get isNodeModules(): boolean {
    // this never triggers rn because the runtime doesn't know origin paths.
    return this.csr.getFileName?.includes("node_modules") ?? false;
  }

  /** Returns true if the path looks like it's from node_modules. */
  public get isOpenTelemetry(): boolean {
    // TODO: This is pretty trash, but the runtime doesn't know that the import path is a package
    return [
      'AsyncLocalStorageContextManager',
      'ContextAPI',
      'Tracer'
    ].includes(this.csr.getTypeName ?? '');
  }

  /** Always produces a file location. */
  public get file(): string {
    return `${this.csr.getFileName}@${this.csr.getLineNumber}:${this.csr.getColumnNumber}`
  }

  /** Always produces a fallback Name. */
  public get fallback(): string {
    return `${this.name ?? "[???]"} @ ${this.file}`;
  }
}

export class WrappedCallsites {
  constructor(
    public readonly entries: WrappedCallsite[],
  ) { }

  /** Gets the first callsite. */
  public get first() { return first(this.entries); }

  /** Gets an ID for the first useful callsite. */
  public get callerId() {
    return (
      (find(this.entries, e => !!e.classId)?.classId)
      ?? (this.first?.name)
      ?? (this.first?.fallback)
    );
  }
}

/** Utilities for callsite tracing. */
export class Tracing {
  /** Get the caller. */
  public static getCaller() {
    return new WrappedCallsites(this.getAll({skip: 3}));
  }

  /** Get the caller and include ourselves. */
  public static get() {
    return new WrappedCallsites(this.getAll({skip: 2}))
  }

  /** Get ALl Callsite Records. Including the one for {@link getAll}. */
  public static getAll(o: CallsiteOptions = {
      skip: 0
  }) {
    const callsites = callsitesApi();
    const result = chain(callsites).drop(o.skip).map(cs => {
      const csProto = Object.getPrototypeOf(cs);
      const csr = chain(Object.getOwnPropertyNames(Object.getPrototypeOf(cs)))
        .without('constructor')
        .filter((k) => csProto[k] instanceof Function)
        .map(k => [k, cs[k]()])
        .fromPairs()
        .value() as unknown as CallsiteRecord;
      return new WrappedCallsite(cs, csr);
    }).value();

    return result;
  }

  /**
   * Gets the file name of the caller.
   */
  public static getCallerFile(): string | undefined {
    const originalFunc = Error.prepareStackTrace;

    let callerfile: string | undefined;
    try {
        const err = new Error();
        let currentfile;

        Error.prepareStackTrace = function (err, stack) { return stack; };


        const stack = (err.stack as unknown as NodeJS.CallSite[])
        debugger;
        currentfile = stack?.shift()?.getFileName();

        while (stack.length) {
            callerfile = stack.shift()?.getFileName();

            if(currentfile !== callerfile) break;
        }
    } catch (e) {
      debugger;
    }

    Error.prepareStackTrace = originalFunc; 

    return callerfile;
  }
}