# @mds-core/mds-policy-service

## 0.12.3

### Patch Changes

- Updated dependencies [2ac7b542]
  - @mds-core/mds-rpc-common@0.3.22
  - @mds-core/mds-geography-service@0.10.26

## 0.12.2

### Patch Changes

- Updated dependencies [7e38afee]
  - @mds-core/mds-repository@0.2.3
  - @mds-core/mds-geography-service@0.10.25

## 0.12.1

### Patch Changes

- ffc3c9f7: Create a standard repository method for truncating all table data
- Updated dependencies [65d1c2b9]
- Updated dependencies [e36b8a46]
- Updated dependencies [ffc3c9f7]
  - @mds-core/mds-service-helpers@0.6.10
  - @mds-core/mds-utils@0.5.2
  - @mds-core/mds-geography-service@0.10.24
  - @mds-core/mds-repository@0.2.2
  - @mds-core/mds-rpc-common@0.3.21
  - @mds-core/mds-schema-validators@0.5.12
  - @mds-core/mds-stream@0.3.3

## 0.12.0

### Minor Changes

- 1e32c275: Rename MDS Policy publish_date -> published_date to conform with MDS 1.0 spec

### Patch Changes

- c9759b66: Resolve linter warnings
- Updated dependencies [455b9852]
- Updated dependencies [c9759b66]
  - @mds-core/mds-stream@0.3.2
  - @mds-core/mds-utils@0.5.1
  - @mds-core/mds-geography-service@0.10.23
  - @mds-core/mds-rpc-common@0.3.20
  - @mds-core/mds-schema-validators@0.5.11
  - @mds-core/mds-repository@0.2.1
  - @mds-core/mds-service-helpers@0.6.9

## 0.11.28

### Patch Changes

- ed8ecc80: Upgrade to TypeORM v3
- Updated dependencies [91159748]
- Updated dependencies [ed8ecc80]
  - @mds-core/mds-rpc-common@0.3.19
  - @mds-core/mds-repository@0.2.0
  - @mds-core/mds-geography-service@0.10.22
  - @mds-core/mds-schema-validators@0.5.10

## 0.11.27

### Patch Changes

- Updated dependencies [5d7601e8]
- Updated dependencies [c9e36e94]
  - @mds-core/mds-service-helpers@0.6.8
  - @mds-core/mds-repository@0.1.47
  - @mds-core/mds-geography-service@0.10.21
  - @mds-core/mds-rpc-common@0.3.18

## 0.11.26

### Patch Changes

- @mds-core/mds-schema-validators@0.5.9
- @mds-core/mds-geography-service@0.10.20

## 0.11.25

### Patch Changes

- Updated dependencies [f010700b]
  - @mds-core/mds-rpc-common@0.3.17
  - @mds-core/mds-geography-service@0.10.19

## 0.11.24

### Patch Changes

- @mds-core/mds-rpc-common@0.3.16
- @mds-core/mds-geography-service@0.10.18

## 0.11.23

### Patch Changes

- Updated dependencies [af3631da]
- Updated dependencies [03a110c1]
  - @mds-core/mds-rpc-common@0.3.15
  - @mds-core/mds-utils@0.5.0
  - @mds-core/mds-geography-service@0.10.17
  - @mds-core/mds-repository@0.1.46
  - @mds-core/mds-schema-validators@0.5.8
  - @mds-core/mds-service-helpers@0.6.7
  - @mds-core/mds-stream@0.3.1

## 0.11.22

### Patch Changes

- Updated dependencies [88984496]
- Updated dependencies [775efc9c]
- Updated dependencies [3ca785d0]
- Updated dependencies [88984496]
  - @mds-core/mds-repository@0.1.45
  - @mds-core/mds-stream@0.3.0
  - @mds-core/mds-geography-service@0.10.16

## 0.11.21

### Patch Changes

- Updated dependencies [bf1f3c4d]
  - @mds-core/mds-rpc-common@0.3.14
  - @mds-core/mds-geography-service@0.10.15
  - @mds-core/mds-stream@0.2.13

## 0.11.20

### Patch Changes

- Updated dependencies [e90243cd]
  - @mds-core/mds-repository@0.1.44
  - @mds-core/mds-geography-service@0.10.14
  - @mds-core/mds-stream@0.2.12

## 0.11.19

### Patch Changes

- aaf3c1cf: Updates Policy to add a new SupersededAt attribute, and compute pending/expired/active statuses based on when a policy actually supersedes another
- a5ab0aa5: Upgrade to Typescript 4.2 and require import/export type usage
- Updated dependencies [ade56b85]
- Updated dependencies [1f6ccdab]
- Updated dependencies [a93da2b6]
- Updated dependencies [a5ab0aa5]
  - @mds-core/mds-schema-validators@0.5.7
  - @mds-core/mds-stream@0.2.11
  - @mds-core/mds-repository@0.1.43
  - @mds-core/mds-geography-service@0.10.13
  - @mds-core/mds-logger@0.5.7
  - @mds-core/mds-rpc-common@0.3.13
  - @mds-core/mds-service-helpers@0.6.6
  - @mds-core/mds-types@0.9.2
  - @mds-core/mds-utils@0.4.2

## 0.11.18

### Patch Changes

- 3b4b5779: Completely remove Joi
- Updated dependencies [3b4b5779]
- Updated dependencies [fea59e19]
  - @mds-core/mds-geography-service@0.10.12
  - @mds-core/mds-schema-validators@0.5.6

## 0.11.17

### Patch Changes

- 95382a3f: Add noUncheckedIndexedAccess compiler flag, and minor (but extensive) changes made in order to support this. Safety first!
- a6575499: Switch to new repository composition functions and deprecate classes
- Updated dependencies [1340ce66]
- Updated dependencies [95382a3f]
- Updated dependencies [a6575499]
  - @mds-core/mds-rpc-common@0.3.12
  - @mds-core/mds-geography-service@0.10.11
  - @mds-core/mds-repository@0.1.42
  - @mds-core/mds-schema-validators@0.5.5
  - @mds-core/mds-types@0.9.1
  - @mds-core/mds-utils@0.4.1
  - @mds-core/mds-service-helpers@0.6.5
  - @mds-core/mds-stream@0.2.10

## 0.11.16

### Patch Changes

- Updated dependencies [c8dc2d20]
- Updated dependencies [28d8a7c3]
- Updated dependencies [86bb2f6f]
  - @mds-core/mds-repository@0.1.41
  - @mds-core/mds-geography-service@0.10.10

## 0.11.15

### Patch Changes

- d98d5693: Cleanup and refactor repository types
- Updated dependencies [d98d5693]
  - @mds-core/mds-geography-service@0.10.9
  - @mds-core/mds-repository@0.1.40

## 0.11.14

### Patch Changes

- 2637f1cc: Upgrade to latest typeorm/pg to support GENERATED ALWAYS AS IDENTITY in migrations
- Updated dependencies [35ff786d]
- Updated dependencies [2637f1cc]
- Updated dependencies [fc42c45a]
  - @mds-core/mds-rpc-common@0.3.11
  - @mds-core/mds-geography-service@0.10.8
  - @mds-core/mds-repository@0.1.39
  - @mds-core/mds-schema-validators@0.5.4

## 0.11.13

### Patch Changes

- Updated dependencies [bc8f0a04]
- Updated dependencies [a942d36c]
  - @mds-core/mds-repository@0.1.38
  - @mds-core/mds-service-helpers@0.6.4
  - @mds-core/mds-geography-service@0.10.7
  - @mds-core/mds-rpc-common@0.3.10

## 0.11.12

### Patch Changes

- ff4ccab5: Removing mds-db.readDevice and updating references to it to call the ingest service instead

## 0.11.11

### Patch Changes

- Updated dependencies [6f834fe4]
  - @mds-core/mds-repository@0.1.37
  - @mds-core/mds-geography-service@0.10.6

## 0.11.10

### Patch Changes

- 8de42ab6: Make Policy Service Kafka writes optional. They now depend on the presence of the KAFKA_HOST environment variable.
- Updated dependencies [ad3fb707]
- Updated dependencies [e9b227c2]
  - @mds-core/mds-repository@0.1.36
  - @mds-core/mds-geography-service@0.10.5
  - @mds-core/mds-rpc-common@0.3.9

## 0.11.9

### Patch Changes

- Updated dependencies [49110532]
- Updated dependencies [bce81d4d]
  - @mds-core/mds-repository@0.1.35
  - @mds-core/mds-utils@0.4.0
  - @mds-core/mds-geography-service@0.10.4
  - @mds-core/mds-rpc-common@0.3.8
  - @mds-core/mds-schema-validators@0.5.3
  - @mds-core/mds-service-helpers@0.6.3
  - @mds-core/mds-stream@0.2.9

## 0.11.8

### Patch Changes

- Updated dependencies [ca45bfaf]
- Updated dependencies [7b061ba5]
- Updated dependencies [ca45bfaf]
  - @mds-core/mds-repository@0.1.34
  - @mds-core/mds-schema-validators@0.5.2
  - @mds-core/mds-rpc-common@0.3.7
  - @mds-core/mds-geography-service@0.10.3

## 0.11.7

### Patch Changes

- Updated dependencies [ccb94996]
  - @mds-core/mds-utils@0.3.1
  - @mds-core/mds-geography-service@0.10.2
  - @mds-core/mds-repository@0.1.33
  - @mds-core/mds-rpc-common@0.3.6
  - @mds-core/mds-schema-validators@0.5.1
  - @mds-core/mds-service-helpers@0.6.2
  - @mds-core/mds-stream@0.2.8

## 0.11.6

### Patch Changes

- Updated dependencies [ba4523c5]
  - @mds-core/mds-geography-service@0.10.1

## 0.11.5

### Patch Changes

- 11b7a478: Changes to support TS 4.5.5
- Updated dependencies [04aca084]
- Updated dependencies [11b7a478]
- Updated dependencies [11b7a478]
- Updated dependencies [11b7a478]
- Updated dependencies [04aca084]
- Updated dependencies [04aca084]
  - @mds-core/mds-geography-service@0.10.0
  - @mds-core/mds-utils@0.3.0
  - @mds-core/mds-rpc-common@0.3.5
  - @mds-core/mds-repository@0.1.32
  - @mds-core/mds-service-helpers@0.6.1
  - @mds-core/mds-stream@0.2.7
  - @mds-core/mds-types@0.9.0
  - @mds-core/mds-logger@0.5.6
  - @mds-core/mds-schema-validators@0.5.0

## 0.11.4

### Patch Changes

- Updated dependencies [cae7ad2b]
- Updated dependencies [cae7ad2b]
  - @mds-core/mds-geography-service@0.9.0
  - @mds-core/mds-service-helpers@0.6.0
  - @mds-core/mds-rpc-common@0.3.4

## 0.11.3

### Patch Changes

- Updated dependencies [bdf3b09d]
- Updated dependencies [c3627656]
  - @mds-core/mds-utils@0.2.17
  - @mds-core/mds-logger@0.5.5
  - @mds-core/mds-geography-service@0.8.3
  - @mds-core/mds-repository@0.1.31
  - @mds-core/mds-rpc-common@0.3.3
  - @mds-core/mds-schema-validators@0.4.3
  - @mds-core/mds-service-helpers@0.5.3
  - @mds-core/mds-stream@0.2.6

## 0.11.2

### Patch Changes

- 9e43b468: Add publishConfig for all packages to include a main entry
- Updated dependencies [9e43b468]
  - @mds-core/mds-geography-service@0.8.2
  - @mds-core/mds-logger@0.5.4
  - @mds-core/mds-repository@0.1.30
  - @mds-core/mds-rpc-common@0.3.2
  - @mds-core/mds-schema-validators@0.4.2
  - @mds-core/mds-service-helpers@0.5.2
  - @mds-core/mds-stream@0.2.5
  - @mds-core/mds-types@0.8.2
  - @mds-core/mds-utils@0.2.16

## 0.11.1

### Patch Changes

- 0993473d: Resolve DEP0128 from Node v16 by removing "main" entry from package.json
- Updated dependencies [0993473d]
  - @mds-core/mds-geography-service@0.8.1
  - @mds-core/mds-logger@0.5.3
  - @mds-core/mds-repository@0.1.29
  - @mds-core/mds-rpc-common@0.3.1
  - @mds-core/mds-schema-validators@0.4.1
  - @mds-core/mds-service-helpers@0.5.1
  - @mds-core/mds-stream@0.2.4
  - @mds-core/mds-types@0.8.1
  - @mds-core/mds-utils@0.2.15

## 0.11.0

### Minor Changes

- c3d2215d: Add support for RPC request contexts

### Patch Changes

- Updated dependencies [c3d2215d]
  - @mds-core/mds-rpc-common@0.3.0
  - @mds-core/mds-geography-service@0.8.0
  - @mds-core/mds-service-helpers@0.5.0

## 0.10.2

### Patch Changes

- Updated dependencies [1dd4db6c]
  - @mds-core/mds-service-helpers@0.4.8
  - @mds-core/mds-geography-service@0.7.2
  - @mds-core/mds-rpc-common@0.2.11

## 0.10.1

### Patch Changes

- d434c404: Import Geography helper methods from a real package, instead of a sub-module
- Updated dependencies [d434c404]
  - @mds-core/mds-geography-service@0.7.1

## 0.10.0

### Minor Changes

- c6956072: Refactor the JSONSchema used by AJV, to strictly include all attributes and validation rules that match the properties described by the type to be validated

### Patch Changes

- 3de5e02e: Adding `propulsion_types` to `BaseRule` to match the spec
- Updated dependencies [cf4b0ecc]
- Updated dependencies [c6956072]
- Updated dependencies [ad126757]
- Updated dependencies [c6956072]
  - @mds-core/mds-utils@0.2.14
  - @mds-core/mds-geography-service@0.7.0
  - @mds-core/mds-types@0.8.0
  - @mds-core/mds-schema-validators@0.4.0
  - @mds-core/mds-repository@0.1.28
  - @mds-core/mds-rpc-common@0.2.10
  - @mds-core/mds-service-helpers@0.4.7
  - @mds-core/mds-stream@0.2.3

## 0.9.7

### Patch Changes

- Updated dependencies [afd5f021]
  - @mds-core/mds-geography-service@0.6.0

## 0.9.6

### Patch Changes

- @mds-core/mds-repository@0.1.27
- @mds-core/mds-schema-validators@0.3.17
- @mds-core/mds-geography-service@0.5.2
- @mds-core/mds-rpc-common@0.2.9

## 0.9.5

### Patch Changes

- Updated dependencies [a4fbd91f]
  - @mds-core/mds-logger@0.5.2
  - @mds-core/mds-geography-service@0.5.1
  - @mds-core/mds-repository@0.1.26
  - @mds-core/mds-rpc-common@0.2.8
  - @mds-core/mds-service-helpers@0.4.6
  - @mds-core/mds-stream@0.2.2
  - @mds-core/mds-utils@0.2.13
  - @mds-core/mds-schema-validators@0.3.16

## 0.9.4

### Patch Changes

- Updated dependencies [09e40cd4]
  - @mds-core/mds-geography-service@0.5.0
  - @mds-core/mds-repository@0.1.25
  - @mds-core/mds-schema-validators@0.3.15
  - @mds-core/mds-rpc-common@0.2.7

## 0.9.3

### Patch Changes

- Updated dependencies [a881d6cc]
  - @mds-core/mds-logger@0.5.1
  - @mds-core/mds-geography-service@0.4.1
  - @mds-core/mds-repository@0.1.24
  - @mds-core/mds-rpc-common@0.2.6
  - @mds-core/mds-service-helpers@0.4.5
  - @mds-core/mds-stream@0.2.1
  - @mds-core/mds-utils@0.2.12
  - @mds-core/mds-schema-validators@0.3.14

## 0.9.2

### Patch Changes

- 102aa5a0: Add a namespace property to all info/warn/error logs
- d63d7e8b: Write published policies to Kafka
- c5a51222: Fix database schema/migrations discrepancies
- Updated dependencies [102aa5a0]
- Updated dependencies [17dde73a]
- Updated dependencies [e9e3048d]
  - @mds-core/mds-logger@0.5.0
  - @mds-core/mds-geography-service@0.4.0
  - @mds-core/mds-repository@0.1.23
  - @mds-core/mds-rpc-common@0.2.5
  - @mds-core/mds-service-helpers@0.4.4
  - @mds-core/mds-stream@0.2.0
  - @mds-core/mds-utils@0.2.11
  - @mds-core/mds-schema-validators@0.3.13

## 0.9.1

### Patch Changes

- d4bd927b: Typeorm now supports generated IDENTITY columns in Postgres
- Updated dependencies [d4bd927b]
  - @mds-core/mds-geography-service@0.3.5
  - @mds-core/mds-repository@0.1.22

## 0.9.0

### Minor Changes

- 9d05e6dc: Fixed bug with webpack erasing classnames and assumed alias used.

### Patch Changes

- Updated dependencies [2cd96944]
- Updated dependencies [add4b114]
- Updated dependencies [ec904976]
  - @mds-core/mds-utils@0.2.10
  - @mds-core/mds-logger@0.4.4
  - @mds-core/mds-rpc-common@0.2.4
  - @mds-core/mds-geography-service@0.3.4
  - @mds-core/mds-repository@0.1.21
  - @mds-core/mds-schema-validators@0.3.12
  - @mds-core/mds-service-helpers@0.4.3

## 0.8.2

### Patch Changes

- Updated dependencies [224bfc3a]
  - @mds-core/mds-rpc-common@0.2.3
  - @mds-core/mds-geography-service@0.3.3

## 0.8.1

### Patch Changes

- 70586f15: Meaningless bump to ensure artifacts are built properly
- Updated dependencies [70586f15]
- Updated dependencies [70586f15]
  - @mds-core/mds-utils@0.2.9
  - @mds-core/mds-geography-service@0.3.2
  - @mds-core/mds-logger@0.4.3
  - @mds-core/mds-repository@0.1.20
  - @mds-core/mds-rpc-common@0.2.2
  - @mds-core/mds-schema-validators@0.3.11
  - @mds-core/mds-service-helpers@0.4.2
  - @mds-core/mds-types@0.7.1

## 0.8.0

### Minor Changes

- a156f493: Added pagination to readPolicies().
- a156f493: Refactor policy entity and add pagination to readPolicies.

### Patch Changes

- 2b3c91c4: Switch to RpcRequest and deprecate RpcRequestWithOptions
- Updated dependencies [2b3c91c4]
- Updated dependencies [a156f493]
  - @mds-core/mds-geography-service@0.3.1
  - @mds-core/mds-rpc-common@0.2.1
  - @mds-core/mds-types@0.7.0
  - @mds-core/mds-repository@0.1.19
  - @mds-core/mds-schema-validators@0.3.10
  - @mds-core/mds-service-helpers@0.4.1
  - @mds-core/mds-utils@0.2.8

## 0.7.0

### Minor Changes

- aa1403da: Update RPC client factory methods and implement retry mechanism when services are unavailable

### Patch Changes

- a1061650: Add namespaced logger, clean up excess logger messages
- Updated dependencies [a1061650]
- Updated dependencies [aa1403da]
- Updated dependencies [3f5c4358]
  - @mds-core/mds-geography-service@0.3.0
  - @mds-core/mds-logger@0.4.2
  - @mds-core/mds-repository@0.1.18
  - @mds-core/mds-rpc-common@0.2.0
  - @mds-core/mds-service-helpers@0.4.0
  - @mds-core/mds-utils@0.2.7
  - @mds-core/mds-types@0.6.1
  - @mds-core/mds-schema-validators@0.3.9

## 0.6.6

### Patch Changes

- Updated dependencies [844098d1]
  - @mds-core/mds-rpc-common@0.1.18
  - @mds-core/mds-geography-service@0.2.5

## 0.6.5

### Patch Changes

- Updated dependencies [0a238253]
- Updated dependencies [0a238253]
- Updated dependencies [d1de33fd]
- Updated dependencies [5c02e73f]
  - @mds-core/mds-types@0.6.0
  - @mds-core/mds-utils@0.2.6
  - @mds-core/mds-rpc-common@0.1.17
  - @mds-core/mds-geography-service@0.2.4
  - @mds-core/mds-repository@0.1.17
  - @mds-core/mds-schema-validators@0.3.8
  - @mds-core/mds-service-helpers@0.3.10

## 0.6.4

### Patch Changes

- f501924c: Bump everything due to previous bad release
- Updated dependencies [f501924c]
  - @mds-core/mds-geography-service@0.2.3
  - @mds-core/mds-logger@0.4.1
  - @mds-core/mds-repository@0.1.16
  - @mds-core/mds-rpc-common@0.1.16
  - @mds-core/mds-schema-validators@0.3.7
  - @mds-core/mds-service-helpers@0.3.9
  - @mds-core/mds-types@0.5.5
  - @mds-core/mds-utils@0.2.5

## 0.6.3

### Patch Changes

- 81220ee6: Upgrade typeorm and pg dependencies
- Updated dependencies [71a9d1de]
- Updated dependencies [7bdfdff5]
- Updated dependencies [81220ee6]
- Updated dependencies [71a9d1de]
  - @mds-core/mds-rpc-common@0.1.15
  - @mds-core/mds-types@0.5.4
  - @mds-core/mds-geography-service@0.2.2
  - @mds-core/mds-repository@0.1.15
  - @mds-core/mds-logger@0.4.0
  - @mds-core/mds-schema-validators@0.3.6
  - @mds-core/mds-service-helpers@0.3.8
  - @mds-core/mds-utils@0.2.4

## 0.6.2

### Patch Changes

- Updated dependencies [5167ec02]
  - @mds-core/mds-types@0.5.3
  - @mds-core/mds-geography-service@0.2.1
  - @mds-core/mds-repository@0.1.14
  - @mds-core/mds-rpc-common@0.1.14
  - @mds-core/mds-schema-validators@0.3.5
  - @mds-core/mds-service-helpers@0.3.7
  - @mds-core/mds-utils@0.2.3

## 0.6.1

### Patch Changes

- Updated dependencies [f5403ec3]
- Updated dependencies [c1001aa8]
- Updated dependencies [a0a29a98]
- Updated dependencies [d8b1387e]
- Updated dependencies [15b9d729]
- Updated dependencies [d8b1387e]
- Updated dependencies [15b9d729]
  - @mds-core/mds-logger@0.3.0
  - @mds-core/mds-types@0.5.2
  - @mds-core/mds-schema-validators@0.3.4
  - @mds-core/mds-geography-service@0.2.0
  - @mds-core/mds-repository@0.1.13
  - @mds-core/mds-rpc-common@0.1.13
  - @mds-core/mds-service-helpers@0.3.6
  - @mds-core/mds-utils@0.2.2

## 0.6.0

### Minor Changes

- 4bbb8a3a: Update policy status filter queries.
- d8b10031: Add new TIME_FORMAT type and stricter validation for start_time and end_time

### Patch Changes

- cab133f5: Default to micromobility state map validation when modality is undefined in policy rule
- Updated dependencies [d8b10031]
  - @mds-core/mds-types@0.5.1
  - @mds-core/mds-geography-service@0.1.12
  - @mds-core/mds-repository@0.1.12
  - @mds-core/mds-rpc-common@0.1.12
  - @mds-core/mds-schema-validators@0.3.3
  - @mds-core/mds-service-helpers@0.3.5
  - @mds-core/mds-utils@0.2.1

## 0.5.0

### Minor Changes

- 61e31276: removed mds-db/policy in favor of mds-policy-service, changed Policy to PolicyDomainModel

### Patch Changes

- Updated dependencies [61e31276]
- Updated dependencies [0f548b7f]
  - @mds-core/mds-types@0.5.0
  - @mds-core/mds-utils@0.2.0
  - @mds-core/mds-rpc-common@0.1.11
  - @mds-core/mds-schema-validators@0.3.2
  - @mds-core/mds-geography-service@0.1.11
  - @mds-core/mds-repository@0.1.11
  - @mds-core/mds-service-helpers@0.3.4

## 0.4.1

### Patch Changes

- Updated dependencies [9af14cbb]
  - @mds-core/mds-logger@0.2.4
  - @mds-core/mds-geography-service@0.1.10
  - @mds-core/mds-repository@0.1.10
  - @mds-core/mds-rpc-common@0.1.10
  - @mds-core/mds-service-helpers@0.3.3
  - @mds-core/mds-utils@0.1.36
  - @mds-core/mds-schema-validators@0.3.1

## 0.4.0

### Minor Changes

- 439f92c5: Vastly clean up Policy types, remove generic extension of ApiServer

### Patch Changes

- 439f92c5: Add support for specifying transaction_types and service_types in Rules, ensure that currency is supplied when making a policy with Rate rules
- 707c4317: Make mds-test-data imports portable
- Updated dependencies [439f92c5]
  - @mds-core/mds-schema-validators@0.3.0
  - @mds-core/mds-types@0.4.0
  - @mds-core/mds-rpc-common@0.1.9
  - @mds-core/mds-geography-service@0.1.9
  - @mds-core/mds-repository@0.1.9
  - @mds-core/mds-service-helpers@0.3.2
  - @mds-core/mds-utils@0.1.35

## 0.3.0

### Minor Changes

- 936a0371: Add PresentationOptions for some PolicyService methods, enabling the display of policy status.
- 8a5bb24e: readPolicies can filter by geography_ids

### Patch Changes

- 936a0371: Add superseded_by column to policies table
- 936a0371: When publishing a new policy, update the superseded_by column for any policies it's superseding
- 42089b3f: removes mds-db from mds-policy

## 0.2.2

### Patch Changes

- b6802757: Updating mds-policy-service so mds-test-data not required to build, and moving some constants to mds-utils
- e6f408d4: fixes some test stability around random service ports
- Updated dependencies [b6802757]
  - @mds-core/mds-utils@0.1.34
  - @mds-core/mds-schema-validators@0.2.3
  - @mds-core/mds-geography-service@0.1.8
  - @mds-core/mds-repository@0.1.8
  - @mds-core/mds-service-helpers@0.3.1
  - @mds-core/mds-rpc-common@0.1.8

## 0.2.1

### Patch Changes

- e0860f5b: refactored mds-policy-author-api to use PolicyServiceClient instead of mds-db
- 6609400b: `vehicle_types` field in BaseRule should be restricted to `VEHICLE_TYPE[]`, not `string[]`
- Updated dependencies [e0860f5b]
- Updated dependencies [6609400b]
  - @mds-core/mds-service-helpers@0.3.0
  - @mds-core/mds-types@0.3.2
  - @mds-core/mds-rpc-common@0.1.7
  - @mds-core/mds-geography-service@0.1.7
  - @mds-core/mds-repository@0.1.7
  - @mds-core/mds-schema-validators@0.2.2
  - @mds-core/mds-utils@0.1.33

## 0.2.0

### Minor Changes

- 5eb4121b: Added policly queries and RPC methods for each query

### Patch Changes

- Updated dependencies [5eb4121b]
- Updated dependencies [5eb4121b]
- Updated dependencies [5eb4121b]
  - @mds-core/mds-service-helpers@0.2.0
  - @mds-core/mds-geography-service@0.1.6
  - @mds-core/mds-types@0.3.1
  - @mds-core/mds-rpc-common@0.1.6
  - @mds-core/mds-repository@0.1.6
  - @mds-core/mds-schema-validators@0.2.1
  - @mds-core/mds-utils@0.1.32

## 0.1.5

### Patch Changes

- 23c9c4a3: Migrated all mds-db/policies queries to typeORM
- Updated dependencies [24231359]
- Updated dependencies [93493a19]
  - @mds-core/mds-schema-validators@0.2.0
  - @mds-core/mds-types@0.3.0
  - @mds-core/mds-utils@0.1.31
  - @mds-core/mds-repository@0.1.5
  - @mds-core/mds-rpc-common@0.1.5
  - @mds-core/mds-service-helpers@0.1.5

## 0.1.4

### Patch Changes

- 8ab4569d: Minor patch change for every package to get versioning aligned with changeset workflows
- Updated dependencies [8ab4569d]
  - @mds-core/mds-repository@0.1.4
  - @mds-core/mds-rpc-common@0.1.4
  - @mds-core/mds-schema-validators@0.1.6
  - @mds-core/mds-service-helpers@0.1.4
  - @mds-core/mds-types@0.2.1
  - @mds-core/mds-utils@0.1.30

## 0.1.3

### Patch Changes

- Updated dependencies [cc0a3bae]
  - @mds-core/mds-types@0.2.0
  - @mds-core/mds-repository@0.1.3
  - @mds-core/mds-rpc-common@0.1.3
  - @mds-core/mds-schema-validators@0.1.5
  - @mds-core/mds-service-helpers@0.1.3
  - @mds-core/mds-utils@0.1.29
