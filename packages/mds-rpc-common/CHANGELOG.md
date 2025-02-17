# @mds-core/mds-rpc-common

## 0.3.28

### Patch Changes

- Updated dependencies [157cc524]
  - @mds-core/mds-api-server@0.4.18
  - @mds-core/mds-utils@0.6.1
  - @mds-core/mds-api-authorizer@0.1.71
  - @mds-core/mds-service-helpers@0.6.14

## 0.3.27

### Patch Changes

- a810503a: Detect RPC Server route conflicts when managing multiple services

## 0.3.26

### Patch Changes

- Updated dependencies [e3aad79e]
- Updated dependencies [e3aad79e]
  - @mds-core/mds-utils@0.6.0
  - @mds-core/mds-api-authorizer@0.1.70
  - @mds-core/mds-api-server@0.4.17
  - @mds-core/mds-service-helpers@0.6.13

## 0.3.25

### Patch Changes

- Updated dependencies [19b45968]
  - @mds-core/mds-logger@0.5.9
  - @mds-core/mds-api-server@0.4.16
  - @mds-core/mds-service-helpers@0.6.12
  - @mds-core/mds-utils@0.5.4
  - @mds-core/mds-api-authorizer@0.1.69

## 0.3.24

### Patch Changes

- 8a3e63d0: Breaking interface changes due to ioredis version bump
- Updated dependencies [8a3e63d0]
  - @mds-core/mds-api-authorizer@0.1.68
  - @mds-core/mds-api-server@0.4.15
  - @mds-core/mds-logger@0.5.8
  - @mds-core/mds-service-helpers@0.6.11
  - @mds-core/mds-utils@0.5.3
  - @mds-core/mds-types@0.9.3

## 0.3.23

### Patch Changes

- Updated dependencies [85b7280e]
  - @mds-core/mds-api-server@0.4.14

## 0.3.22

### Patch Changes

- 2ac7b542: Apply custom routes and middleware before registering grpc routes, allows other body parsers to be added before the catch-call

## 0.3.21

### Patch Changes

- Updated dependencies [65d1c2b9]
  - @mds-core/mds-service-helpers@0.6.10
  - @mds-core/mds-utils@0.5.2
  - @mds-core/mds-api-server@0.4.13
  - @mds-core/mds-api-authorizer@0.1.67

## 0.3.20

### Patch Changes

- c9759b66: Resolve linter warnings
- Updated dependencies [455b9852]
- Updated dependencies [c9759b66]
  - @mds-core/mds-utils@0.5.1
  - @mds-core/mds-api-server@0.4.12
  - @mds-core/mds-api-authorizer@0.1.66
  - @mds-core/mds-service-helpers@0.6.9

## 0.3.19

### Patch Changes

- 91159748: removed unit.js tests, convert to jest

## 0.3.18

### Patch Changes

- Updated dependencies [5d7601e8]
  - @mds-core/mds-service-helpers@0.6.8
  - @mds-core/mds-api-server@0.4.11

## 0.3.17

### Patch Changes

- f010700b: Resolve TS2742 error for non-portable type export

## 0.3.16

### Patch Changes

- Updated dependencies [abde42f5]
  - @mds-core/mds-api-authorizer@0.1.65
  - @mds-core/mds-api-server@0.4.10

## 0.3.15

### Patch Changes

- af3631da: Stash API authorization context so it can be passed to RPC services without reparsing
- Updated dependencies [af3631da]
- Updated dependencies [03a110c1]
  - @mds-core/mds-api-authorizer@0.1.64
  - @mds-core/mds-api-server@0.4.9
  - @mds-core/mds-utils@0.5.0
  - @mds-core/mds-service-helpers@0.6.7

## 0.3.14

### Patch Changes

- bf1f3c4d: Add optional top-level onStart/onStop handlers to RpcServiceManager

## 0.3.13

### Patch Changes

- a5ab0aa5: Upgrade to Typescript 4.2 and require import/export type usage
- Updated dependencies [a5ab0aa5]
  - @mds-core/mds-api-server@0.4.8
  - @mds-core/mds-logger@0.5.7
  - @mds-core/mds-service-helpers@0.6.6
  - @mds-core/mds-types@0.9.2
  - @mds-core/mds-utils@0.4.2

## 0.3.12

### Patch Changes

- 1340ce66: Exclude request logging for RPC server /health
- 95382a3f: Add noUncheckedIndexedAccess compiler flag, and minor (but extensive) changes made in order to support this. Safety first!
- Updated dependencies [95382a3f]
  - @mds-core/mds-api-server@0.4.7
  - @mds-core/mds-types@0.9.1
  - @mds-core/mds-utils@0.4.1
  - @mds-core/mds-service-helpers@0.6.5

## 0.3.11

### Patch Changes

- 35ff786d: Support running multiple RPC services under the same host/manager

## 0.3.10

### Patch Changes

- Updated dependencies [bc8f0a04]
  - @mds-core/mds-service-helpers@0.6.4
  - @mds-core/mds-api-server@0.4.6

## 0.3.9

### Patch Changes

- Updated dependencies [896e4925]
  - @mds-core/mds-api-server@0.4.5

## 0.3.8

### Patch Changes

- Updated dependencies [bce81d4d]
  - @mds-core/mds-utils@0.4.0
  - @mds-core/mds-api-server@0.4.4
  - @mds-core/mds-service-helpers@0.6.3

## 0.3.7

### Patch Changes

- ca45bfaf: Remove RpcServer type
  - @mds-core/mds-api-server@0.4.3

## 0.3.6

### Patch Changes

- Updated dependencies [ccb94996]
  - @mds-core/mds-utils@0.3.1
  - @mds-core/mds-api-server@0.4.2
  - @mds-core/mds-service-helpers@0.6.2

## 0.3.5

### Patch Changes

- 11b7a478: Export RpcServer type
- 11b7a478: Changes to support TS 4.5.5
- Updated dependencies [04aca084]
- Updated dependencies [11b7a478]
- Updated dependencies [04aca084]
- Updated dependencies [04aca084]
  - @mds-core/mds-utils@0.3.0
  - @mds-core/mds-service-helpers@0.6.1
  - @mds-core/mds-types@0.9.0
  - @mds-core/mds-api-server@0.4.1
  - @mds-core/mds-logger@0.5.6

## 0.3.4

### Patch Changes

- Updated dependencies [cae7ad2b]
  - @mds-core/mds-api-server@0.4.0
  - @mds-core/mds-service-helpers@0.6.0

## 0.3.3

### Patch Changes

- Updated dependencies [bdf3b09d]
- Updated dependencies [c3627656]
  - @mds-core/mds-utils@0.2.17
  - @mds-core/mds-logger@0.5.5
  - @mds-core/mds-api-server@0.3.23
  - @mds-core/mds-service-helpers@0.5.3

## 0.3.2

### Patch Changes

- 9e43b468: Add publishConfig for all packages to include a main entry
- Updated dependencies [9e43b468]
  - @mds-core/mds-api-server@0.3.22
  - @mds-core/mds-logger@0.5.4
  - @mds-core/mds-service-helpers@0.5.2
  - @mds-core/mds-types@0.8.2
  - @mds-core/mds-utils@0.2.16

## 0.3.1

### Patch Changes

- 0993473d: Resolve DEP0128 from Node v16 by removing "main" entry from package.json
- Updated dependencies [0993473d]
  - @mds-core/mds-api-server@0.3.21
  - @mds-core/mds-logger@0.5.3
  - @mds-core/mds-service-helpers@0.5.1
  - @mds-core/mds-types@0.8.1
  - @mds-core/mds-utils@0.2.15

## 0.3.0

### Minor Changes

- c3d2215d: Add support for RPC request contexts

### Patch Changes

- Updated dependencies [c3d2215d]
  - @mds-core/mds-service-helpers@0.5.0
  - @mds-core/mds-api-server@0.3.20

## 0.2.11

### Patch Changes

- Updated dependencies [1dd4db6c]
  - @mds-core/mds-service-helpers@0.4.8
  - @mds-core/mds-api-server@0.3.19

## 0.2.10

### Patch Changes

- Updated dependencies [cf4b0ecc]
- Updated dependencies [c6956072]
- Updated dependencies [ad126757]
  - @mds-core/mds-utils@0.2.14
  - @mds-core/mds-types@0.8.0
  - @mds-core/mds-api-server@0.3.18
  - @mds-core/mds-service-helpers@0.4.7

## 0.2.9

### Patch Changes

- @mds-core/mds-api-server@0.3.17

## 0.2.8

### Patch Changes

- Updated dependencies [a4fbd91f]
  - @mds-core/mds-logger@0.5.2
  - @mds-core/mds-api-server@0.3.16
  - @mds-core/mds-service-helpers@0.4.6
  - @mds-core/mds-utils@0.2.13

## 0.2.7

### Patch Changes

- @mds-core/mds-api-server@0.3.15

## 0.2.6

### Patch Changes

- Updated dependencies [a881d6cc]
  - @mds-core/mds-logger@0.5.1
  - @mds-core/mds-api-server@0.3.14
  - @mds-core/mds-service-helpers@0.4.5
  - @mds-core/mds-utils@0.2.12

## 0.2.5

### Patch Changes

- 102aa5a0: Add a namespace property to all info/warn/error logs
- Updated dependencies [102aa5a0]
  - @mds-core/mds-logger@0.5.0
  - @mds-core/mds-api-server@0.3.13
  - @mds-core/mds-service-helpers@0.4.4
  - @mds-core/mds-utils@0.2.11

## 0.2.4

### Patch Changes

- ec904976: Allow addition of custom http routes to RPC server
- Updated dependencies [2cd96944]
- Updated dependencies [f51ea149]
- Updated dependencies [add4b114]
  - @mds-core/mds-utils@0.2.10
  - @mds-core/mds-api-server@0.3.12
  - @mds-core/mds-logger@0.4.4
  - @mds-core/mds-service-helpers@0.4.3

## 0.2.3

### Patch Changes

- 224bfc3a: Disable service retries during testing by default

## 0.2.2

### Patch Changes

- 70586f15: Meaningless bump to ensure artifacts are built properly
- Updated dependencies [70586f15]
- Updated dependencies [70586f15]
  - @mds-core/mds-utils@0.2.9
  - @mds-core/mds-api-server@0.3.11
  - @mds-core/mds-logger@0.4.3
  - @mds-core/mds-service-helpers@0.4.2
  - @mds-core/mds-types@0.7.1

## 0.2.1

### Patch Changes

- 2b3c91c4: Switch to RpcRequest and deprecate RpcRequestWithOptions
- Updated dependencies [1e0156d3]
- Updated dependencies [a156f493]
  - @mds-core/mds-api-server@0.3.10
  - @mds-core/mds-types@0.7.0
  - @mds-core/mds-service-helpers@0.4.1
  - @mds-core/mds-utils@0.2.8

## 0.2.0

### Minor Changes

- aa1403da: Update RPC client factory methods and implement retry mechanism when services are unavailable

### Patch Changes

- a1061650: Add namespaced logger, clean up excess logger messages
- Updated dependencies [a1061650]
- Updated dependencies [a1061650]
- Updated dependencies [aa1403da]
- Updated dependencies [3f5c4358]
  - @mds-core/mds-api-server@0.3.9
  - @mds-core/mds-logger@0.4.2
  - @mds-core/mds-service-helpers@0.4.0
  - @mds-core/mds-utils@0.2.7
  - @mds-core/mds-types@0.6.1

## 0.1.18

### Patch Changes

- 844098d1: Use new version of rpc_ts which supports express compression middleware

## 0.1.17

### Patch Changes

- d1de33fd: Switch to lacuna fork of rpc_ts
- Updated dependencies [0a238253]
- Updated dependencies [5c02e73f]
  - @mds-core/mds-types@0.6.0
  - @mds-core/mds-service-helpers@0.3.10
  - @mds-core/mds-api-server@0.3.8

## 0.1.16

### Patch Changes

- f501924c: Bump everything due to previous bad release
- Updated dependencies [f501924c]
  - @mds-core/mds-api-server@0.3.7
  - @mds-core/mds-logger@0.4.1
  - @mds-core/mds-service-helpers@0.3.9
  - @mds-core/mds-types@0.5.5

## 0.1.15

### Patch Changes

- 71a9d1de: Add namespaced logger for mds-rpc-common, and debug logs for RPCRequest time client-side.
- Updated dependencies [7bdfdff5]
- Updated dependencies [71a9d1de]
  - @mds-core/mds-types@0.5.4
  - @mds-core/mds-logger@0.4.0
  - @mds-core/mds-service-helpers@0.3.8
  - @mds-core/mds-api-server@0.3.6

## 0.1.14

### Patch Changes

- Updated dependencies [5167ec02]
  - @mds-core/mds-types@0.5.3
  - @mds-core/mds-service-helpers@0.3.7
  - @mds-core/mds-api-server@0.3.5

## 0.1.13

### Patch Changes

- 15b9d729: Upgrade dependencies
- Updated dependencies [f5403ec3]
- Updated dependencies [c1001aa8]
- Updated dependencies [270c1665]
- Updated dependencies [a0a29a98]
- Updated dependencies [15b9d729]
- Updated dependencies [15b9d729]
  - @mds-core/mds-logger@0.3.0
  - @mds-core/mds-types@0.5.2
  - @mds-core/mds-api-server@0.3.4
  - @mds-core/mds-service-helpers@0.3.6

## 0.1.12

### Patch Changes

- Updated dependencies [d8b10031]
  - @mds-core/mds-types@0.5.1
  - @mds-core/mds-service-helpers@0.3.5
  - @mds-core/mds-api-server@0.3.3

## 0.1.11

### Patch Changes

- 0f548b7f: Make logging of a request's remote address optional and enable it for RPC requests
- Updated dependencies [61e31276]
- Updated dependencies [8e42a84a]
  - @mds-core/mds-types@0.5.0
  - @mds-core/mds-api-server@0.3.2
  - @mds-core/mds-service-helpers@0.3.4

## 0.1.10

### Patch Changes

- Updated dependencies [9af14cbb]
  - @mds-core/mds-logger@0.2.4
  - @mds-core/mds-api-server@0.3.1
  - @mds-core/mds-service-helpers@0.3.3

## 0.1.9

### Patch Changes

- Updated dependencies [439f92c5]
  - @mds-core/mds-api-server@0.3.0
  - @mds-core/mds-types@0.4.0
  - @mds-core/mds-service-helpers@0.3.2

## 0.1.8

### Patch Changes

- @mds-core/mds-api-server@0.2.1
- @mds-core/mds-service-helpers@0.3.1

## 0.1.7

### Patch Changes

- Updated dependencies [e0860f5b]
- Updated dependencies [6609400b]
  - @mds-core/mds-api-server@0.2.0
  - @mds-core/mds-service-helpers@0.3.0
  - @mds-core/mds-types@0.3.2

## 0.1.6

### Patch Changes

- Updated dependencies [5eb4121b]
- Updated dependencies [5eb4121b]
  - @mds-core/mds-service-helpers@0.2.0
  - @mds-core/mds-types@0.3.1
  - @mds-core/mds-api-server@0.1.32

## 0.1.5

### Patch Changes

- Updated dependencies [24231359]
  - @mds-core/mds-types@0.3.0
  - @mds-core/mds-service-helpers@0.1.5
  - @mds-core/mds-api-server@0.1.31

## 0.1.4

### Patch Changes

- 8ab4569d: Minor patch change for every package to get versioning aligned with changeset workflows
- Updated dependencies [8ab4569d]
  - @mds-core/mds-api-server@0.1.30
  - @mds-core/mds-logger@0.2.3
  - @mds-core/mds-service-helpers@0.1.4
  - @mds-core/mds-types@0.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [cc0a3bae]
  - @mds-core/mds-types@0.2.0
  - @mds-core/mds-service-helpers@0.1.3
  - @mds-core/mds-api-server@0.1.29
