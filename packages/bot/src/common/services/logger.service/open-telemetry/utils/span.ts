import { Span, SpanStatusCode} from '@opentelemetry/api';

/** Applies try/catch/finally logic to a span lambda. */
export function tryCatchFinally<T = void>(
  innerFn: (span: Span) => Promise<T>
): (span: Span) => Promise<T> {
  return async (span) => {
    try {
      const res = await innerFn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return res;
    }
    catch (e: unknown) {
      if (e instanceof Error) { 
        span.recordException(e);
      }
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw e;
    }
    finally {
      span.end();
    }
  };
}