import { Injectable } from "injection-js";

/** Contains global state for the app. */
@Injectable()
export class GlobalAppState {
  /** Singleton Instance. */
  public static Instance: GlobalAppState = new GlobalAppState();

  private constructor() { }

  /** Set to true once the Client becoems ready. */
  public isAfterClientReady: boolean = false;
}

/** Singleton instance of GlobalAppState */
export const GLOBAL_STATE: GlobalAppState = GlobalAppState.Instance;