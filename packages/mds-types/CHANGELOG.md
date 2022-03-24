# @mds-core/mds-types

## 0.9.2

### Patch Changes

- a5ab0aa5: Upgrade to Typescript 4.2 and require import/export type usage

## 0.9.1

### Patch Changes

- 95382a3f: Add noUncheckedIndexedAccess compiler flag, and minor (but extensive) changes made in order to support this. Safety first!

## 0.9.0

### Minor Changes

- 04aca084: removed Geography from mds-types, and related validator

### Patch Changes

- 11b7a478: Changes to support TS 4.5.5

## 0.8.2

### Patch Changes

- 9e43b468: Add publishConfig for all packages to include a main entry

## 0.8.1

### Patch Changes

- 0993473d: Resolve DEP0128 from Node v16 by removing "main" entry from package.json

## 0.8.0

### Minor Changes

- c6956072: Refactor the JSONSchema used by AJV, to strictly include all attributes and validation rules that match the properties described by the type to be validated

### Patch Changes

- ad126757: Improve documentation for utility types.

## 0.7.1

### Patch Changes

- 70586f15: Meaningless bump to ensure artifacts are built properly

## 0.7.0

### Minor Changes

- a156f493: Added pagination to readPolicies().

## 0.6.1

### Patch Changes

- 3f5c4358: Enforce clockwise (positive) GPS heading values

## 0.6.0

### Minor Changes

- 0a238253: Set Telemetry to non-nullable on VehicleEvents/EventDomainModel

### Patch Changes

- 5c02e73f: Add Compliance Violation Entity

## 0.5.5

### Patch Changes

- f501924c: Bump everything due to previous bad release

## 0.5.4

### Patch Changes

- 7bdfdff5: Fix ExtendedKeys utility type comment

## 0.5.3

### Patch Changes

- 5167ec02: Add SetIntersection, ExtendedKeys, and DeepExtended keys generic types.

## 0.5.2

### Patch Changes

- c1001aa8: Add DeepPartial type
- 15b9d729: Upgrade dependencies

## 0.5.1

### Patch Changes

- d8b10031: Remove TIME_FORMAT type

## 0.5.0

### Minor Changes

- 61e31276: removed deprecated type Policy, moved fixture data and utility methods to packages that directly need them

## 0.4.0

### Minor Changes

- 439f92c5: Vastly clean up Policy types, remove generic extension of ApiServer

## 0.3.2

### Patch Changes

- 6609400b: `vehicle_types` field in BaseRule should be restricted to `VEHICLE_TYPE[]`, not `string[]`

## 0.3.1

### Patch Changes

- 5eb4121b: Fixed BaseRule.value_url, to have 'string' instead of URL, so that it can be serialized on the RPC client

## 0.3.0

### Minor Changes

- 24231359: Remove delta, service_area_id, and timestamp_long from a variety of vehicle event types

## 0.2.1

### Patch Changes

- 8ab4569d: Minor patch change for every package to get versioning aligned with changeset workflows

## 0.2.0

### Minor Changes

- cc0a3bae: Added support for dead-letter sinks to StreamProcessors
