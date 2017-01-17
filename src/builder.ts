import { FirebaseEnv } from './env';
import { Event, RawEvent } from './event';

// We export a type that uses RawEvent so it must itself be exported from this module.
export { RawEvent } from './event';

export interface TriggerAnnotated {
  __trigger: TriggerDefinition;
}

export interface EventTriggerDefinition {
  eventType: string;
  resource: string;
  path?: string;
}
export interface TriggerDefinition {
  httpsTrigger?: Object;
  eventTrigger?: EventTriggerDefinition;
}

/* A CloudFunction is both an object that exports its trigger definitions at __trigger and
   can be called as a function using the raw JS API for Google Cloud Functions. */
export type CloudFunction = TriggerAnnotated & ((event: RawEvent) => PromiseLike<any> | any);

export class FunctionBuilder {
  protected _env: FirebaseEnv;

  constructor(env: FirebaseEnv) {
    this._env = env;
  }

  protected _toTrigger(event?: string): TriggerDefinition {
    throw new Error('Unimplemented _toTrigger');
  }

  protected _makeHandler<EventData>(
    fn: (event?: Event<EventData>) => PromiseLike<any> | any,
    event: string,
  ): CloudFunction {
    let fnWithDataConstructor: any = (payload: RawEvent) => {
      return fn(new Event(payload, this._dataConstructor<EventData>(payload)));
    };
    let handler: any = (payload) => {
      return this._env.ready().then(function() {
        return fnWithDataConstructor(payload);
      });
    };
    handler.__trigger = this._toTrigger(event);

    return handler;
  }

  protected _dataConstructor<EventData>(raw: RawEvent): EventData {
    return raw.data;
  }
}