import { ReadShape } from '@rest-hooks/core/endpoint';
import { NetworkError, UnknownError } from '@rest-hooks/core/types';
import { Schema } from '@rest-hooks/endpoint';

import useMeta from './useMeta';

export interface SyntheticError extends Error {
  status: number;
  response?: undefined;
  synthetic: true;
}

type UseErrorReturn<P> = P extends null
  ? undefined
  :
      | ((NetworkError | UnknownError) & { synthetic?: undefined | false })
      | SyntheticError
      | undefined;

/** Access a resource or error if failed to get it */
export default function useError<
  Params extends Readonly<object>,
  S extends Schema
>(
  fetchShape: Pick<ReadShape<S, Params>, 'getFetchKey' | 'schema' | 'options'>,
  params: Params | null,
  cacheReady: boolean,
): UseErrorReturn<typeof params> {
  const meta = useMeta(fetchShape, params);
  if (!params) return;
  if (!cacheReady) {
    if (!meta) return;
    // this means the response is missing an expected entity
    if (!meta.error && !meta.invalidated) {
      let error: Error & { status?: number; synthetic?: boolean };
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        error = new Error(
          `Entity from "${fetchShape.getFetchKey(params)}" not found in cache.

        This is likely due to a malformed response.
        Try inspecting the network response or fetch() return value.

        Schema: ${JSON.stringify(fetchShape.schema, null, 2)}`,
        );
      } /* istanbul ignore next */ else {
        error = new Error(
          `Missing required entity in "${fetchShape.getFetchKey(
            params,
          )}" likely due to malformed response.`,
        );
      }
      error.status = 400;
      error.synthetic = true;
      return error as any;
    } else {
      return meta.error as any;
    }
  }
}
