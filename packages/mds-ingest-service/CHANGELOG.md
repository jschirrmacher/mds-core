# @mds-core/mds-ingest-service

## 0.10.14

### Patch Changes

- Updated dependencies [2ac7b542]
  - @mds-core/mds-rpc-common@0.3.22

## 0.10.13

### Patch Changes

- Updated dependencies [7e38afee]
  - @mds-core/mds-repository@0.2.3

## 0.10.12

### Patch Changes

- ffc3c9f7: Create a standard repository method for truncating all table data
- Updated dependencies [65d1c2b9]
- Updated dependencies [ffc3c9f7]
  - @mds-core/mds-service-helpers@0.6.10
  - @mds-core/mds-utils@0.5.2
  - @mds-core/mds-repository@0.2.2
  - @mds-core/mds-rpc-common@0.3.21
  - @mds-core/mds-schema-validators@0.5.12
  - @mds-core/mds-stream@0.3.3

## 0.10.11

### Patch Changes

- a24824a4: Adding `.getH3Bins`
- 455b9852: remove referneces to sinon
- c9759b66: Resolve linter warnings
- Updated dependencies [455b9852]
- Updated dependencies [c9759b66]
  - @mds-core/mds-stream@0.3.2
  - @mds-core/mds-utils@0.5.1
  - @mds-core/mds-rpc-common@0.3.20
  - @mds-core/mds-schema-validators@0.5.11
  - @mds-core/mds-repository@0.2.1
  - @mds-core/mds-service-helpers@0.6.9

## 0.10.10

### Patch Changes

- ed8ecc80: Upgrade to TypeORM v3
- Updated dependencies [91159748]
- Updated dependencies [ed8ecc80]
  - @mds-core/mds-rpc-common@0.3.19
  - @mds-core/mds-repository@0.2.0
  - @mds-core/mds-schema-validators@0.5.10

## 0.10.9

### Patch Changes

- Updated dependencies [5d7601e8]
- Updated dependencies [c9e36e94]
  - @mds-core/mds-service-helpers@0.6.8
  - @mds-core/mds-repository@0.1.47
  - @mds-core/mds-rpc-common@0.3.18

## 0.10.8

### Patch Changes

- @mds-core/mds-schema-validators@0.5.9

## 0.10.7

### Patch Changes

- Updated dependencies [f010700b]
  - @mds-core/mds-rpc-common@0.3.17

## 0.10.6

### Patch Changes

- @mds-core/mds-rpc-common@0.3.16

## 0.10.5

### Patch Changes

- Updated dependencies [af3631da]
- Updated dependencies [03a110c1]
  - @mds-core/mds-rpc-common@0.3.15
  - @mds-core/mds-utils@0.5.0
  - @mds-core/mds-repository@0.1.46
  - @mds-core/mds-schema-validators@0.5.8
  - @mds-core/mds-service-helpers@0.6.7
  - @mds-core/mds-stream@0.3.1

## 0.10.4

### Patch Changes

- 775efc9c: Add TelemetryAnnotation type, entity, and create method
- 3ca785d0: Move mds-stream's AgencyStream to mds-ingest-service, rename to IngestStream
- Updated dependencies [88984496]
- Updated dependencies [775efc9c]
- Updated dependencies [3ca785d0]
- Updated dependencies [88984496]
  - @mds-core/mds-repository@0.1.45
  - @mds-core/mds-stream@0.3.0

## 0.10.3

### Patch Changes

- Updated dependencies [bf1f3c4d]
  - @mds-core/mds-rpc-common@0.3.14
  - @mds-core/mds-stream@0.2.13

## 0.10.2

### Patch Changes

- Updated dependencies [e90243cd]
  - @mds-core/mds-repository@0.1.44
  - @mds-core/mds-stream@0.2.12

## 0.10.1

### Patch Changes

- ade56b85: Replacing Device with DeviceDomainModel
- a5ab0aa5: Upgrade to Typescript 4.2 and require import/export type usage
- Updated dependencies [ade56b85]
- Updated dependencies [1f6ccdab]
- Updated dependencies [a93da2b6]
- Updated dependencies [a5ab0aa5]
  - @mds-core/mds-schema-validators@0.5.7
  - @mds-core/mds-stream@0.2.11
  - @mds-core/mds-repository@0.1.43
  - @mds-core/mds-logger@0.5.7
  - @mds-core/mds-rpc-common@0.3.13
  - @mds-core/mds-service-helpers@0.6.6
  - @mds-core/mds-types@0.9.2
  - @mds-core/mds-utils@0.4.2

## 0.10.0

### Minor Changes

- e0ed188e: Removing migration code.

## 0.9.17

### Patch Changes

- 3b4b5779: Completely remove Joi
- Updated dependencies [3b4b5779]
- Updated dependencies [fea59e19]
  - @mds-core/mds-schema-validators@0.5.6
  - @mds-core/mds-agency-cache@0.4.19

## 0.9.16

### Patch Changes

- 95382a3f: Add noUncheckedIndexedAccess compiler flag, and minor (but extensive) changes made in order to support this. Safety first!
- a6575499: Switch to new repository composition functions and deprecate classes
- Updated dependencies [1340ce66]
- Updated dependencies [95382a3f]
- Updated dependencies [a6575499]
  - @mds-core/mds-rpc-common@0.3.12
  - @mds-core/mds-agency-cache@0.4.18
  - @mds-core/mds-repository@0.1.42
  - @mds-core/mds-schema-validators@0.5.5
  - @mds-core/mds-types@0.9.1
  - @mds-core/mds-utils@0.4.1
  - @mds-core/mds-service-helpers@0.6.5
  - @mds-core/mds-stream@0.2.10

## 0.9.15

### Patch Changes

- 28d8a7c3: Use dedicated migration metadata table for each repository
- Updated dependencies [c8dc2d20]
- Updated dependencies [28d8a7c3]
- Updated dependencies [86bb2f6f]
  - @mds-core/mds-repository@0.1.41

## 0.9.14

### Patch Changes

- d98d5693: Cleanup and refactor repository types
- Updated dependencies [d98d5693]
  - @mds-core/mds-repository@0.1.40

## 0.9.13

### Patch Changes

- 2637f1cc: Upgrade to latest typeorm/pg to support GENERATED ALWAYS AS IDENTITY in migrations
- Updated dependencies [35ff786d]
- Updated dependencies [2637f1cc]
- Updated dependencies [fc42c45a]
  - @mds-core/mds-rpc-common@0.3.11
  - @mds-core/mds-repository@0.1.39
  - @mds-core/mds-schema-validators@0.5.4
  - @mds-core/mds-agency-cache@0.4.17

## 0.9.12

### Patch Changes

- Updated dependencies [bc8f0a04]
- Updated dependencies [a942d36c]
  - @mds-core/mds-repository@0.1.38
  - @mds-core/mds-service-helpers@0.6.4
  - @mds-core/mds-rpc-common@0.3.10

## 0.9.11

### Patch Changes

- ff4ccab5: Removing mds-db.readDevice and updating references to it to call the ingest service instead

## 0.9.10

### Patch Changes

- 6f834fe4: Rename database function to mds_epoch_ms()
- Updated dependencies [6f834fe4]
  - @mds-core/mds-repository@0.1.37

## 0.9.9

### Patch Changes

- e9b227c2: Use a function for setting recorded column default
- Updated dependencies [ad3fb707]
- Updated dependencies [e9b227c2]
  - @mds-core/mds-repository@0.1.36
  - @mds-core/mds-rpc-common@0.3.9

## 0.9.8

### Patch Changes

- 49110532: Add DesignType decorators to some columns
- bce81d4d: Add getDeviceEvents method to fetch events by device
- Updated dependencies [49110532]
- Updated dependencies [bce81d4d]
  - @mds-core/mds-repository@0.1.35
  - @mds-core/mds-utils@0.4.0
  - @mds-core/mds-agency-cache@0.4.16
  - @mds-core/mds-rpc-common@0.3.8
  - @mds-core/mds-schema-validators@0.5.3
  - @mds-core/mds-service-helpers@0.6.3
  - @mds-core/mds-stream@0.2.9

## 0.9.7

### Patch Changes

- 7b061ba5: Making calls to mds-provider async as preparation for migrating the static providers list in mds-providers to a database
- Updated dependencies [ca45bfaf]
- Updated dependencies [7b061ba5]
- Updated dependencies [ca45bfaf]
  - @mds-core/mds-repository@0.1.34
  - @mds-core/mds-schema-validators@0.5.2
  - @mds-core/mds-rpc-common@0.3.7
  - @mds-core/mds-agency-cache@0.4.15

## 0.9.6

### Patch Changes

- Updated dependencies [ccb94996]
  - @mds-core/mds-utils@0.3.1
  - @mds-core/mds-agency-cache@0.4.14
  - @mds-core/mds-repository@0.1.33
  - @mds-core/mds-rpc-common@0.3.6
  - @mds-core/mds-schema-validators@0.5.1
  - @mds-core/mds-service-helpers@0.6.2
  - @mds-core/mds-stream@0.2.8

## 0.9.5

### Patch Changes

- 11b7a478: Changes to support TS 4.5.5
- Updated dependencies [04aca084]
- Updated dependencies [11b7a478]
- Updated dependencies [11b7a478]
- Updated dependencies [11b7a478]
- Updated dependencies [04aca084]
- Updated dependencies [04aca084]
  - @mds-core/mds-utils@0.3.0
  - @mds-core/mds-rpc-common@0.3.5
  - @mds-core/mds-repository@0.1.32
  - @mds-core/mds-agency-cache@0.4.13
  - @mds-core/mds-service-helpers@0.6.1
  - @mds-core/mds-stream@0.2.7
  - @mds-core/mds-types@0.9.0
  - @mds-core/mds-logger@0.5.6
  - @mds-core/mds-providers@0.2.6
  - @mds-core/mds-schema-validators@0.5.0

## 0.9.4

### Patch Changes

- Updated dependencies [cae7ad2b]
  - @mds-core/mds-service-helpers@0.6.0
  - @mds-core/mds-rpc-common@0.3.4

## 0.9.3

### Patch Changes

- Updated dependencies [bdf3b09d]
- Updated dependencies [c3627656]
  - @mds-core/mds-utils@0.2.17
  - @mds-core/mds-logger@0.5.5
  - @mds-core/mds-agency-cache@0.4.12
  - @mds-core/mds-repository@0.1.31
  - @mds-core/mds-rpc-common@0.3.3
  - @mds-core/mds-schema-validators@0.4.3
  - @mds-core/mds-service-helpers@0.5.3
  - @mds-core/mds-stream@0.2.6

## 0.9.2

### Patch Changes

- 9e43b468: Add publishConfig for all packages to include a main entry
- Updated dependencies [9e43b468]
  - @mds-core/mds-agency-cache@0.4.11
  - @mds-core/mds-logger@0.5.4
  - @mds-core/mds-providers@0.2.5
  - @mds-core/mds-repository@0.1.30
  - @mds-core/mds-rpc-common@0.3.2
  - @mds-core/mds-schema-validators@0.4.2
  - @mds-core/mds-service-helpers@0.5.2
  - @mds-core/mds-stream@0.2.5
  - @mds-core/mds-types@0.8.2
  - @mds-core/mds-utils@0.2.16

## 0.9.1

### Patch Changes

- 0993473d: Resolve DEP0128 from Node v16 by removing "main" entry from package.json
- Updated dependencies [0993473d]
  - @mds-core/mds-agency-cache@0.4.10
  - @mds-core/mds-logger@0.5.3
  - @mds-core/mds-providers@0.2.4
  - @mds-core/mds-repository@0.1.29
  - @mds-core/mds-rpc-common@0.3.1
  - @mds-core/mds-schema-validators@0.4.1
  - @mds-core/mds-service-helpers@0.5.1
  - @mds-core/mds-stream@0.2.4
  - @mds-core/mds-types@0.8.1
  - @mds-core/mds-utils@0.2.15

## 0.9.0

### Minor Changes

- e19f42db: Allow bypassing RPC when calling the getTripEvents method.

## 0.8.0

### Minor Changes

- c3d2215d: Add support for RPC request contexts

### Patch Changes

- Updated dependencies [c3d2215d]
  - @mds-core/mds-rpc-common@0.3.0
  - @mds-core/mds-service-helpers@0.5.0

## 0.7.1

### Patch Changes

- Updated dependencies [1dd4db6c]
  - @mds-core/mds-service-helpers@0.4.8
  - @mds-core/mds-rpc-common@0.2.11

## 0.7.0

### Minor Changes

- c6956072: Refactor the JSONSchema used by AJV, to strictly include all attributes and validation rules that match the properties described by the type to be validated

### Patch Changes

- Updated dependencies [cf4b0ecc]
- Updated dependencies [c6956072]
- Updated dependencies [ad126757]
- Updated dependencies [c6956072]
  - @mds-core/mds-utils@0.2.14
  - @mds-core/mds-types@0.8.0
  - @mds-core/mds-schema-validators@0.4.0
  - @mds-core/mds-agency-cache@0.4.9
  - @mds-core/mds-repository@0.1.28
  - @mds-core/mds-rpc-common@0.2.10
  - @mds-core/mds-service-helpers@0.4.7
  - @mds-core/mds-stream@0.2.3
  - @mds-core/mds-providers@0.2.3

## 0.6.11

### Patch Changes

- Updated dependencies [3fcddef9]
  - @mds-core/mds-providers@0.2.2
  - @mds-core/mds-repository@0.1.27
  - @mds-core/mds-schema-validators@0.3.17
  - @mds-core/mds-agency-cache@0.4.8
  - @mds-core/mds-rpc-common@0.2.9

## 0.6.10

### Patch Changes

- Updated dependencies [a4fbd91f]
- Updated dependencies [fd6aea05]
  - @mds-core/mds-logger@0.5.2
  - @mds-core/mds-providers@0.2.1
  - @mds-core/mds-agency-cache@0.4.7
  - @mds-core/mds-repository@0.1.26
  - @mds-core/mds-rpc-common@0.2.8
  - @mds-core/mds-service-helpers@0.4.6
  - @mds-core/mds-stream@0.2.2
  - @mds-core/mds-utils@0.2.13
  - @mds-core/mds-schema-validators@0.3.16

## 0.6.9

### Patch Changes

- Updated dependencies [bb63d77f]
  - @mds-core/mds-providers@0.2.0
  - @mds-core/mds-repository@0.1.25
  - @mds-core/mds-schema-validators@0.3.15
  - @mds-core/mds-agency-cache@0.4.6
  - @mds-core/mds-rpc-common@0.2.7

## 0.6.8

### Patch Changes

- Updated dependencies [a881d6cc]
  - @mds-core/mds-logger@0.5.1
  - @mds-core/mds-agency-cache@0.4.5
  - @mds-core/mds-repository@0.1.24
  - @mds-core/mds-rpc-common@0.2.6
  - @mds-core/mds-service-helpers@0.4.5
  - @mds-core/mds-stream@0.2.1
  - @mds-core/mds-utils@0.2.12
  - @mds-core/mds-schema-validators@0.3.14

## 0.6.7

### Patch Changes

- 102aa5a0: Add a namespace property to all info/warn/error logs
- c5a51222: Fix database schema/migrations discrepancies
- Updated dependencies [102aa5a0]
- Updated dependencies [17dde73a]
  - @mds-core/mds-logger@0.5.0
  - @mds-core/mds-agency-cache@0.4.4
  - @mds-core/mds-repository@0.1.23
  - @mds-core/mds-rpc-common@0.2.5
  - @mds-core/mds-service-helpers@0.4.4
  - @mds-core/mds-stream@0.2.0
  - @mds-core/mds-utils@0.2.11
  - @mds-core/mds-schema-validators@0.3.13

## 0.6.6

### Patch Changes

- d4bd927b: Typeorm now supports generated IDENTITY columns in Postgres
- Updated dependencies [d4bd927b]
  - @mds-core/mds-repository@0.1.22

## 0.6.5

### Patch Changes

- 5d78cbed: Change event query to INNER join on telemetry since it is now required for all events

## 0.6.4

### Patch Changes

- Updated dependencies [2cd96944]
- Updated dependencies [add4b114]
- Updated dependencies [ec904976]
- Updated dependencies [85158deb]
- Updated dependencies [c0c8f12f]
  - @mds-core/mds-utils@0.2.10
  - @mds-core/mds-logger@0.4.4
  - @mds-core/mds-rpc-common@0.2.4
  - @mds-core/mds-providers@0.1.45
  - @mds-core/mds-agency-cache@0.4.3
  - @mds-core/mds-repository@0.1.21
  - @mds-core/mds-schema-validators@0.3.12
  - @mds-core/mds-service-helpers@0.4.3
  - @mds-core/mds-stream@0.1.47

## 0.6.3

### Patch Changes

- Updated dependencies [224bfc3a]
  - @mds-core/mds-rpc-common@0.2.3

## 0.6.2

### Patch Changes

- 70586f15: Meaningless bump to ensure artifacts are built properly
- Updated dependencies [70586f15]
- Updated dependencies [70586f15]
  - @mds-core/mds-utils@0.2.9
  - @mds-core/mds-agency-cache@0.4.2
  - @mds-core/mds-logger@0.4.3
  - @mds-core/mds-providers@0.1.44
  - @mds-core/mds-repository@0.1.20
  - @mds-core/mds-rpc-common@0.2.2
  - @mds-core/mds-schema-validators@0.3.11
  - @mds-core/mds-service-helpers@0.4.2
  - @mds-core/mds-stream@0.1.46
  - @mds-core/mds-types@0.7.1

## 0.6.1

### Patch Changes

- 2b3c91c4: Switch to RpcRequest and deprecate RpcRequestWithOptions
- Updated dependencies [2b3c91c4]
- Updated dependencies [a156f493]
  - @mds-core/mds-rpc-common@0.2.1
  - @mds-core/mds-types@0.7.0
  - @mds-core/mds-agency-cache@0.4.1
  - @mds-core/mds-providers@0.1.43
  - @mds-core/mds-repository@0.1.19
  - @mds-core/mds-schema-validators@0.3.10
  - @mds-core/mds-service-helpers@0.4.1
  - @mds-core/mds-stream@0.1.45
  - @mds-core/mds-utils@0.2.8

## 0.6.0

### Minor Changes

- 788cfbfa: Implemented case insensitive vehicle_id comparison.
- aa1403da: Update RPC client factory methods and implement retry mechanism when services are unavailable

### Patch Changes

- 913dff02: updated mds-agency-cache to use multi-write cache methods
- a1061650: Add namespaced logger, clean up excess logger messages
- f6511653: Correct view definition to use INNER JOIN instead of LEFT JOIN
- 2d16fa02: Write telemetry when writing migrated events.
- 3f5c4358: Enforce clockwise (positive) GPS heading values
- Updated dependencies [913dff02]
- Updated dependencies [a1061650]
- Updated dependencies [a1061650]
- Updated dependencies [aa1403da]
- Updated dependencies [3f5c4358]
  - @mds-core/mds-agency-cache@0.4.0
  - @mds-core/mds-logger@0.4.2
  - @mds-core/mds-repository@0.1.18
  - @mds-core/mds-rpc-common@0.2.0
  - @mds-core/mds-service-helpers@0.4.0
  - @mds-core/mds-stream@0.1.44
  - @mds-core/mds-utils@0.2.7
  - @mds-core/mds-types@0.6.1
  - @mds-core/mds-schema-validators@0.3.9
  - @mds-core/mds-providers@0.1.42

## 0.5.1

### Patch Changes

- 28c9e946: Add env var option to enable RPC
- Updated dependencies [844098d1]
  - @mds-core/mds-rpc-common@0.1.18

## 0.5.0

### Minor Changes

- 0a238253: Set Telemetry to non-nullable on VehicleEvents/EventDomainModel

### Patch Changes

- Updated dependencies [0a238253]
- Updated dependencies [0a238253]
- Updated dependencies [d1de33fd]
- Updated dependencies [5c02e73f]
  - @mds-core/mds-agency-cache@0.3.0
  - @mds-core/mds-types@0.6.0
  - @mds-core/mds-utils@0.2.6
  - @mds-core/mds-rpc-common@0.1.17
  - @mds-core/mds-providers@0.1.41
  - @mds-core/mds-repository@0.1.17
  - @mds-core/mds-schema-validators@0.3.8
  - @mds-core/mds-service-helpers@0.3.10
  - @mds-core/mds-stream@0.1.43

## 0.4.9

### Patch Changes

- f501924c: Bump everything due to previous bad release
- Updated dependencies [f501924c]
  - @mds-core/mds-agency-cache@0.2.11
  - @mds-core/mds-logger@0.4.1
  - @mds-core/mds-providers@0.1.40
  - @mds-core/mds-repository@0.1.16
  - @mds-core/mds-rpc-common@0.1.16
  - @mds-core/mds-schema-validators@0.3.7
  - @mds-core/mds-service-helpers@0.3.9
  - @mds-core/mds-stream@0.1.42
  - @mds-core/mds-types@0.5.5
  - @mds-core/mds-utils@0.2.5

## 0.4.8

### Patch Changes

- eebaac90: Change getEventsUsingOptions and getDevices to not use RPC temporarily

## 0.4.7

### Patch Changes

- 4bbd8a08: Add a follow option to allow using a cursor to poll for new data

## 0.4.6

### Patch Changes

- 81220ee6: Upgrade typeorm and pg dependencies
- Updated dependencies [71a9d1de]
- Updated dependencies [7bdfdff5]
- Updated dependencies [81220ee6]
- Updated dependencies [71a9d1de]
  - @mds-core/mds-rpc-common@0.1.15
  - @mds-core/mds-types@0.5.4
  - @mds-core/mds-repository@0.1.15
  - @mds-core/mds-logger@0.4.0
  - @mds-core/mds-agency-cache@0.2.10
  - @mds-core/mds-providers@0.1.39
  - @mds-core/mds-schema-validators@0.3.6
  - @mds-core/mds-service-helpers@0.3.8
  - @mds-core/mds-stream@0.1.41
  - @mds-core/mds-utils@0.2.4

## 0.4.5

### Patch Changes

- Updated dependencies [5167ec02]
- Updated dependencies [5167ec02]
  - @mds-core/mds-types@0.5.3
  - @mds-core/mds-stream@0.1.40
  - @mds-core/mds-agency-cache@0.2.9
  - @mds-core/mds-providers@0.1.38
  - @mds-core/mds-repository@0.1.14
  - @mds-core/mds-rpc-common@0.1.14
  - @mds-core/mds-schema-validators@0.3.5
  - @mds-core/mds-service-helpers@0.3.7
  - @mds-core/mds-utils@0.2.3

## 0.4.4

### Patch Changes

- 6bd0d935: Add new Ingest Service method for getting events joined with device and telemetry info
- 1300191f: adds index to telemetry timestamp column
- 54bcb01d: optimize last telemetry for device query
- f535e6ab: Add identity column to device/telemetry streams
- Updated dependencies [c1001aa8]
- Updated dependencies [f5403ec3]
- Updated dependencies [c1001aa8]
- Updated dependencies [a0a29a98]
- Updated dependencies [d8b1387e]
- Updated dependencies [15b9d729]
- Updated dependencies [15b9d729]
  - @mds-core/mds-stream@0.1.39
  - @mds-core/mds-logger@0.3.0
  - @mds-core/mds-types@0.5.2
  - @mds-core/mds-schema-validators@0.3.4
  - @mds-core/mds-agency-cache@0.2.8
  - @mds-core/mds-repository@0.1.13
  - @mds-core/mds-rpc-common@0.1.13
  - @mds-core/mds-service-helpers@0.3.6
  - @mds-core/mds-utils@0.2.2
  - @mds-core/mds-providers@0.1.37

## 0.4.3

### Patch Changes

- Updated dependencies [d8b10031]
  - @mds-core/mds-types@0.5.1
  - @mds-core/mds-agency-cache@0.2.7
  - @mds-core/mds-providers@0.1.36
  - @mds-core/mds-repository@0.1.12
  - @mds-core/mds-rpc-common@0.1.12
  - @mds-core/mds-schema-validators@0.3.3
  - @mds-core/mds-service-helpers@0.3.5
  - @mds-core/mds-stream@0.1.38
  - @mds-core/mds-utils@0.2.1

## 0.4.2

### Patch Changes

- 015b3afd: Add id column to streamed/cached events
- Updated dependencies [61e31276]
- Updated dependencies [0f548b7f]
  - @mds-core/mds-types@0.5.0
  - @mds-core/mds-utils@0.2.0
  - @mds-core/mds-rpc-common@0.1.11
  - @mds-core/mds-schema-validators@0.3.2
  - @mds-core/mds-agency-cache@0.2.6
  - @mds-core/mds-providers@0.1.35
  - @mds-core/mds-repository@0.1.11
  - @mds-core/mds-service-helpers@0.3.4
  - @mds-core/mds-stream@0.1.37

## 0.4.1

### Patch Changes

- 1579e76e: Add getTripEvents service method
- Updated dependencies [9af14cbb]
- Updated dependencies [9af14cbb]
  - @mds-core/mds-logger@0.2.4
  - @mds-core/mds-agency-cache@0.2.5
  - @mds-core/mds-repository@0.1.10
  - @mds-core/mds-rpc-common@0.1.10
  - @mds-core/mds-service-helpers@0.3.3
  - @mds-core/mds-stream@0.1.36
  - @mds-core/mds-utils@0.1.36
  - @mds-core/mds-schema-validators@0.3.1

## 0.4.0

### Minor Changes

- 0e0abffd: added getTripEvents to mds-ingest-service

### Patch Changes

- 15fbc633: Synchronize mds-ingest-service schema/models

## 0.3.4

### Patch Changes

- Updated dependencies [439f92c5]
  - @mds-core/mds-schema-validators@0.3.0
  - @mds-core/mds-types@0.4.0
  - @mds-core/mds-rpc-common@0.1.9
  - @mds-core/mds-agency-cache@0.2.4
  - @mds-core/mds-providers@0.1.34
  - @mds-core/mds-repository@0.1.9
  - @mds-core/mds-service-helpers@0.3.2
  - @mds-core/mds-stream@0.1.35
  - @mds-core/mds-utils@0.1.35

## 0.3.3

### Patch Changes

- 1cb521ca: Add service method for getting latest telemetry for a list of devices
- ba33f76a: Add cache and stream hooks to ingest migration processor
- e3fc9d1e: Filter register events from the incoming 0.4 stream

## 0.3.2

### Patch Changes

- Updated dependencies [b6802757]
  - @mds-core/mds-utils@0.1.34
  - @mds-core/mds-schema-validators@0.2.3
  - @mds-core/mds-repository@0.1.8
  - @mds-core/mds-service-helpers@0.3.1
  - @mds-core/mds-rpc-common@0.1.8

## 0.3.1

### Patch Changes

- 0b917ead: Persist migrated entities to database
- Updated dependencies [e0860f5b]
- Updated dependencies [6609400b]
  - @mds-core/mds-service-helpers@0.3.0
  - @mds-core/mds-types@0.3.2
  - @mds-core/mds-rpc-common@0.1.7
  - @mds-core/mds-providers@0.1.33
  - @mds-core/mds-repository@0.1.7
  - @mds-core/mds-schema-validators@0.2.2
  - @mds-core/mds-utils@0.1.33

## 0.3.0

### Minor Changes

- 12455bee: Implement filtering vehicle events by geography ids.

### Patch Changes

- Updated dependencies [5eb4121b]
- Updated dependencies [7e56b9b6]
- Updated dependencies [5eb4121b]
  - @mds-core/mds-service-helpers@0.2.0
  - @mds-core/mds-providers@0.1.32
  - @mds-core/mds-types@0.3.1
  - @mds-core/mds-rpc-common@0.1.6
  - @mds-core/mds-repository@0.1.6
  - @mds-core/mds-schema-validators@0.2.1
  - @mds-core/mds-utils@0.1.32

## 0.2.0

### Minor Changes

- 24231359: Remove delta, service_area_id, and timestamp_long from a variety of vehicle event types
- aeedb169: Add new foreign key to event_annotations to associate with events.

### Patch Changes

- 93493a19: Move testEnvSafeguard method to mds-utils
- da513885: Add missing name property to mds-ingst-service migration AddEventsRowIdColumn1627427307591
- Updated dependencies [24231359]
- Updated dependencies [93493a19]
  - @mds-core/mds-schema-validators@0.2.0
  - @mds-core/mds-types@0.3.0
  - @mds-core/mds-utils@0.1.31
  - @mds-core/mds-providers@0.1.31
  - @mds-core/mds-repository@0.1.5
  - @mds-core/mds-rpc-common@0.1.5
  - @mds-core/mds-service-helpers@0.1.5

## 0.1.5

### Patch Changes

- 62a188ae: Add initial ingest migration processor

## 0.1.4

### Patch Changes

- 8ab4569d: Minor patch change for every package to get versioning aligned with changeset workflows
- Updated dependencies [8ab4569d]
  - @mds-core/mds-logger@0.2.3
  - @mds-core/mds-providers@0.1.30
  - @mds-core/mds-repository@0.1.4
  - @mds-core/mds-rpc-common@0.1.4
  - @mds-core/mds-schema-validators@0.1.6
  - @mds-core/mds-service-helpers@0.1.4
  - @mds-core/mds-types@0.2.1
  - @mds-core/mds-utils@0.1.30

## 0.1.3

### Patch Changes

- 156e1121: rework Paginator.paginate, to work well
- Updated dependencies [cc0a3bae]
  - @mds-core/mds-types@0.2.0
  - @mds-core/mds-providers@0.1.29
  - @mds-core/mds-repository@0.1.3
  - @mds-core/mds-rpc-common@0.1.3
  - @mds-core/mds-schema-validators@0.1.5
  - @mds-core/mds-service-helpers@0.1.3
  - @mds-core/mds-utils@0.1.29
