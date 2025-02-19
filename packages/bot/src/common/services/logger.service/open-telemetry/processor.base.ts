import { LogRecordProcessor } from "@opentelemetry/sdk-logs";
import { MetricReader } from "@opentelemetry/sdk-metrics";
import { SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { valuesIn } from "lodash";

/** A set of configured exporters. */
export interface OTel_Processor_Bundle {
  /** Exporter for metrics. */
  metrics: MetricReader[];

  /** Exporter for traces. */
  tracer: SpanProcessor[];

  /** Exporter for logs. */
  logs: LogRecordProcessor[];
};

export function SingletonOrExisting<T>() {
  return class Singleton {
    private static _instance?: T;

    constructor() { }
  
    /** Configured instance (or default). Must `set` before ever retrieving to initialize custom from . */
    public static get instance(): T {
      this._instance ??= new this() as T;
      return this._instance;
    }
    public static set instance(value: T) {
      if (!!this._instance) {
        throw new Error("Instance must be set before it is ever retrieved.");
      }
  
      this._instance = value;
    }
  }
}
export abstract class OTel_Processor_Source<T extends (new () => InstanceType<T>)> extends SingletonOrExisting<OTel_Processor_Source<any>>() {
  #existingExporters?: OTel_Processor_Bundle;

  /** Generates a singleton set of exporters, then freezes this instance for further modification. */
  public get exporters(): OTel_Processor_Bundle {
    this.#existingExporters ??= this.makeExporters();
    valuesIn(this).forEach(o => Object.freeze(o));
    return this.#existingExporters;
  }

  /** Generates exporters based on current configuration. */
  public abstract makeExporters(): OTel_Processor_Bundle;
}

// type DefaultCtorAbstractPermissive<T extends abstract new (...args: any) => any> = T extends (abstract new () => InstanceType<T>) ? InstanceType<T> : never;
// type DefaultCtorPermissive<T extends abstract new (...args: any) => any> = T extends (new () => InstanceType<T>) ? InstanceType<T> : never;

// type DefaultCtorAbstract<T extends abstract new () => any> = T extends (abstract new () => InstanceType<T>) ? InstanceType<T> : never;
// type DefaultCtor<T extends (new () => InstanceType<T>)> = T;
// type Roundabout<T> = T extends InstanceType<infer T2> ? T2 : never
