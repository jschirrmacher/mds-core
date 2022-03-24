import type { DeepPick, DeepPickPath } from 'ts-deep-pick'

/**
 * deepPickProperties exists as a way to extract deeply nested properties from an object.
 *
 * @param entity The entity to pick from
 * @param unparsedPaths Paths to pick from entity. SUPPORTED GRAMMAR: Key names, separated by '.' for property access. The type may say it supports otherwise, but this is all that's supported.
 * @returns The deeply picked entity
 * @example
 * ```typescript
 * // You can pass in a list of keys (even nested ones!) to extract those values from the type
 * const x: { telemetry: { gps: { lat: 1 } }, event_type: 'foo' } = deepPickProperties({ telemetry: { gps: { lat: 1, lng: 2 } }, event_type: 'foo' }, [
      'telemetry.gps.lat',
      'event_type'
    ])
 * ```
 * @example
 * ```typescript
 * // You can pass in no paths in order for deepPickProperties to act as the identity function.
 * const y: { telemetry: { gps: { lat: 1, lng: 2 } }, event_type: 'foo' } = deepPickProperties({ telemetry: { gps: { lat: 1, lng: 2 } }, event_type: 'foo' })
 */
export const deepPickProperties = <T, P extends DeepPickPath<T>[] = ['*']>(
  entity: T,
  unparsedPaths?: P
): P extends ['*'] ? DeepPick<T, '*'> : DeepPick<T, P[number]> => {
  if (!unparsedPaths?.length) {
    return entity as P extends ['*'] ? DeepPick<T, '*'> : DeepPick<T, P[number]> // this is a pretty wacky assertion, but is necessary because conditional returns on functions in TS are weird
  }

  const paths = unparsedPaths.map(p => p.split('.')).filter(({ length }) => length) // split on '.' and filter out empty strings

  return Object.entries(entity).reduce((acc, [key, value]) => {
    if (paths.some(([head]) => head === key)) {
      /**
       * The paths that are relevant to this key
       */
      const filteredPaths = paths.filter(path => path[0] === key)
      /**
       * The paths that are more than one level deep
       */
      const nestedPaths = filteredPaths.filter(path => path.length > 2)
      /**
       * The paths that are one level deep
       */
      const oneLevelPaths = filteredPaths.filter((path): path is [string, string] => path.length === 2)
      /**
       * The paths that are at the top level
       */
      const topLevelPaths = filteredPaths.filter((path): path is [string] => path.length === 1)

      if (topLevelPaths.length > 0) {
        // If there are top-level paths, we can just return the value
        acc[key] = value
      } else {
        acc[key] = {
          /**
           * Extracts values from paths that are only one-level deep and relevant to this key
           */
          ...oneLevelPaths.reduce((oneLevelAcc, [, tail]) => {
            oneLevelAcc[tail] = value[tail]
            return oneLevelAcc
          }, {} as any),
          /**
           * Recursively extract values from paths that are more than one level deep (if applicable)
           */
          ...(nestedPaths.length > 0
            ? deepPickProperties(
                value,
                nestedPaths.map(([, ...rest]) => {
                  return rest.join('.')
                })
              )
            : {})
        }
      }
    }
    return acc
  }, {} as any)
}
