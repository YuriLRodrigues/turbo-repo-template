import { ApiError, toApiErrorBody } from './api-error'

type AnyResponse = { status: number; data: unknown }

/** The successful answers of a generated function: the members of its union with a 2xx status. */
export type SuccessOf<TResponse extends AnyResponse> = Extract<TResponse, { status: 200 | 201 | 202 | 204 }>

/**
 * From "a value for every status" to "the data, or an exception": what TanStack Query wants in a `queryFn` or a
 * `mutationFn`. A non-2xx answer becomes an `ApiError` carrying the API's stable `code`.
 *
 *   useQuery({ queryKey: noteKeys.list(params), queryFn: () => unwrap(listNotes(params)) })
 */
export const unwrap = async <TResponse extends AnyResponse>(
  response: Promise<TResponse>,
): Promise<SuccessOf<TResponse>['data']> => {
  const { status, data } = await response
  if (status >= 200 && status < 300) return data as SuccessOf<TResponse>['data']

  throw new ApiError(toApiErrorBody(status, data))
}
