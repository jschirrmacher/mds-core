# @mds-core/mds-logger

## 0.5.7

### Patch Changes

- a5ab0aa5: Upgrade to Typescript 4.2 and require import/export type usage

## 0.5.6

### Patch Changes

- 11b7a478: Changes to support TS 4.5.5

## 0.5.5

### Patch Changes

- c3627656: Enhance log redaction with support for additional redaction properties, also added additional defaults for latitude and longitude

## 0.5.4

### Patch Changes

- 9e43b468: Add publishConfig for all packages to include a main entry

## 0.5.3

### Patch Changes

- 0993473d: Resolve DEP0128 from Node v16 by removing "main" entry from package.json

## 0.5.2

### Patch Changes

- a4fbd91f: Remove deprecated mds-logger methods

## 0.5.1

### Patch Changes

- a881d6cc: Use proper namespace prefix for logs

## 0.5.0

### Minor Changes

- 102aa5a0: Add a namespace property to all info/warn/error logs

## 0.4.4

### Patch Changes

- add4b114: Fix log output so it includes contextual logs for computed properties, and disable debug logs when QUIET=true

## 0.4.3

### Patch Changes

- 70586f15: Meaningless bump to ensure artifacts are built properly

## 0.4.2

### Patch Changes

- a1061650: Add namespaced logger, clean up excess logger messages

## 0.4.1

### Patch Changes

- f501924c: Bump everything due to previous bad release

## 0.4.0

### Minor Changes

- 71a9d1de: Add new createLogger method, enabling namespaced loggers for packages. This will be refactored in the future to be a little more breaking, most likely.

## 0.3.0

### Minor Changes

- f5403ec3: Add enhanced logging using the debug module. See README for new invocation examples.
  Refactored mds-logger under-the-hood substantially to lean more on native pino functionality.
- a0a29a98: Use pino instead of console for logging

### Patch Changes

- 15b9d729: Resolve pino-pretty webpack error
- 15b9d729: Upgrade dependencies

## 0.2.4

### Patch Changes

- 9af14cbb: Fix unit tests for mds-logger to work properly with QUIET=true

## 0.2.3

### Patch Changes

- 8ab4569d: Minor patch change for every package to get versioning aligned with changeset workflows
