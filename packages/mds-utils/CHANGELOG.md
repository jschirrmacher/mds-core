# @mds-core/mds-utils

## 0.5.0

### Minor Changes

- 03a110c1: removed date-time-utils, refactored tests from mocha to jest

## 0.4.2

### Patch Changes

- a5ab0aa5: Upgrade to Typescript 4.2 and require import/export type usage
- Updated dependencies [a5ab0aa5]
  - @mds-core/mds-logger@0.5.7
  - @mds-core/mds-types@0.9.2

## 0.4.1

### Patch Changes

- 95382a3f: Add noUncheckedIndexedAccess compiler flag, and minor (but extensive) changes made in order to support this. Safety first!
- Updated dependencies [95382a3f]
  - @mds-core/mds-types@0.9.1

## 0.4.0

### Minor Changes

- bce81d4d: Add taxi state machine validation support to isEventSequenceValid, require mode as an option.

## 0.3.1

### Patch Changes

- ccb94996: When deriving error reasons, JSON.stringify() errors that are simple objects

## 0.3.0

### Minor Changes

- 04aca084: moved getPolygon util method to mds-geography-service

### Patch Changes

- 11b7a478: Changes to support TS 4.5.5
- 04aca084: converted usage of mds-db to mds-geography-service
- Updated dependencies [11b7a478]
- Updated dependencies [04aca084]
  - @mds-core/mds-types@0.9.0
  - @mds-core/mds-logger@0.5.6

## 0.2.17

### Patch Changes

- bdf3b09d: Add deepPickProperties function.
- Updated dependencies [c3627656]
  - @mds-core/mds-logger@0.5.5

## 0.2.16

### Patch Changes

- 9e43b468: Add publishConfig for all packages to include a main entry
- Updated dependencies [9e43b468]
  - @mds-core/mds-logger@0.5.4
  - @mds-core/mds-types@0.8.2

## 0.2.15

### Patch Changes

- 0993473d: Resolve DEP0128 from Node v16 by removing "main" entry from package.json
- Updated dependencies [0993473d]
  - @mds-core/mds-logger@0.5.3
  - @mds-core/mds-types@0.8.1

## 0.2.14

### Patch Changes

- cf4b0ecc: Remove Node.js dependencies
- Updated dependencies [c6956072]
- Updated dependencies [ad126757]
  - @mds-core/mds-types@0.8.0

## 0.2.13

### Patch Changes

- Updated dependencies [a4fbd91f]
  - @mds-core/mds-logger@0.5.2

## 0.2.12

### Patch Changes

- Updated dependencies [a881d6cc]
  - @mds-core/mds-logger@0.5.1

## 0.2.11

### Patch Changes

- 102aa5a0: Add a namespace property to all info/warn/error logs
- Updated dependencies [102aa5a0]
  - @mds-core/mds-logger@0.5.0

## 0.2.10

### Patch Changes

- 2cd96944: Update pointInGeometry so it doesn't log 'cannot check point in shape...' every time it fails, unless using DEBUG mode.
- Updated dependencies [add4b114]
  - @mds-core/mds-logger@0.4.4

## 0.2.9

### Patch Changes

- 70586f15: Don't throw in pointInGeometry when shape is not supported
- 70586f15: Meaningless bump to ensure artifacts are built properly
- Updated dependencies [70586f15]
  - @mds-core/mds-logger@0.4.3
  - @mds-core/mds-types@0.7.1

## 0.2.8

### Patch Changes

- Updated dependencies [a156f493]
  - @mds-core/mds-types@0.7.0

## 0.2.7

### Patch Changes

- a1061650: Add namespaced logger, clean up excess logger messages
- Updated dependencies [a1061650]
- Updated dependencies [3f5c4358]
  - @mds-core/mds-logger@0.4.2
  - @mds-core/mds-types@0.6.1

## 0.2.6

### Patch Changes

- 0a238253: Add zip method for zipping up lists with a mapper
- Updated dependencies [0a238253]
- Updated dependencies [5c02e73f]
  - @mds-core/mds-types@0.6.0

## 0.2.5

### Patch Changes

- f501924c: Bump everything due to previous bad release
- Updated dependencies [f501924c]
  - @mds-core/mds-logger@0.4.1
  - @mds-core/mds-types@0.5.5

## 0.2.4

### Patch Changes

- Updated dependencies [7bdfdff5]
- Updated dependencies [71a9d1de]
  - @mds-core/mds-types@0.5.4
  - @mds-core/mds-logger@0.4.0

## 0.2.3

### Patch Changes

- Updated dependencies [5167ec02]
  - @mds-core/mds-types@0.5.3

## 0.2.2

### Patch Changes

- 15b9d729: Upgrade dependencies
- Updated dependencies [f5403ec3]
- Updated dependencies [c1001aa8]
- Updated dependencies [a0a29a98]
- Updated dependencies [15b9d729]
- Updated dependencies [15b9d729]
  - @mds-core/mds-logger@0.3.0
  - @mds-core/mds-types@0.5.2

## 0.2.1

### Patch Changes

- Updated dependencies [d8b10031]
  - @mds-core/mds-types@0.5.1

## 0.2.0

### Minor Changes

- 61e31276: removed deprecated type Policy, moved fixture data and utility methods to packages that directly need them

### Patch Changes

- Updated dependencies [61e31276]
  - @mds-core/mds-types@0.5.0

## 0.1.36

### Patch Changes

- Updated dependencies [9af14cbb]
  - @mds-core/mds-logger@0.2.4

## 0.1.35

### Patch Changes

- Updated dependencies [439f92c5]
  - @mds-core/mds-types@0.4.0

## 0.1.34

### Patch Changes

- b6802757: Updating mds-policy-service so mds-test-data not required to build, and moving some constants to mds-utils

## 0.1.33

### Patch Changes

- Updated dependencies [6609400b]
  - @mds-core/mds-types@0.3.2

## 0.1.32

### Patch Changes

- Updated dependencies [5eb4121b]
  - @mds-core/mds-types@0.3.1

## 0.1.31

### Patch Changes

- 93493a19: Move testEnvSafeguard method to mds-utils
- Updated dependencies [24231359]
  - @mds-core/mds-types@0.3.0

## 0.1.30

### Patch Changes

- 8ab4569d: Minor patch change for every package to get versioning aligned with changeset workflows
- Updated dependencies [8ab4569d]
  - @mds-core/mds-logger@0.2.3
  - @mds-core/mds-types@0.2.1

## 0.1.29

### Patch Changes

- Updated dependencies [cc0a3bae]
  - @mds-core/mds-types@0.2.0
