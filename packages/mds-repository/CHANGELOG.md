# @mds-core/mds-repository

## 0.1.46

### Patch Changes

- Updated dependencies [03a110c1]
  - @mds-core/mds-utils@0.5.0
  - @mds-core/mds-config-files@0.1.4

## 0.1.45

### Patch Changes

- 88984496: Add MapModels helper function for invoking model mappers
- 88984496: Allow using data files from different locations for seeding repository tables
- Updated dependencies [88984496]
  - @mds-core/mds-config-files@0.1.3

## 0.1.44

### Patch Changes

- e90243cd: Add yaml support to mds-config-service
- Updated dependencies [e90243cd]
  - @mds-core/mds-config-files@0.1.2

## 0.1.43

### Patch Changes

- 1f6ccdab: Add support for initial repository data seeding from JSON files
- a5ab0aa5: Upgrade to Typescript 4.2 and require import/export type usage
- Updated dependencies [cde3743c]
- Updated dependencies [a5ab0aa5]
  - @mds-core/mds-config-files@0.1.1
  - @mds-core/mds-logger@0.5.7
  - @mds-core/mds-types@0.9.2
  - @mds-core/mds-utils@0.4.2

## 0.1.42

### Patch Changes

- 95382a3f: Add noUncheckedIndexedAccess compiler flag, and minor (but extensive) changes made in order to support this. Safety first!
- a6575499: Switch to new repository composition functions and deprecate classes
- Updated dependencies [95382a3f]
  - @mds-core/mds-types@0.9.1
  - @mds-core/mds-utils@0.4.1

## 0.1.41

### Patch Changes

- c8dc2d20: Fix access modifiers in mds-repository
- 28d8a7c3: Use dedicated migration metadata table for each repository
- 86bb2f6f: Add new mds-repository methods to support functional repository composition

## 0.1.40

### Patch Changes

- d98d5693: Cleanup and refactor repository types

## 0.1.39

### Patch Changes

- 2637f1cc: Upgrade to latest typeorm/pg to support GENERATED ALWAYS AS IDENTITY in migrations

## 0.1.38

### Patch Changes

- bc8f0a04: Switch tests from Mocha to Jest
- a942d36c: Add some new transformers/decorators and remove some unused filters from mds-repository

## 0.1.37

### Patch Changes

- 6f834fe4: Rename database function to mds_epoch_ms()

## 0.1.36

### Patch Changes

- ad3fb707: Don't index the id column when it's part of the PK
- e9b227c2: Use a function for setting recorded column default

## 0.1.35

### Patch Changes

- 49110532: Add DesignType decorator to Recorded column class
- Updated dependencies [bce81d4d]
  - @mds-core/mds-utils@0.4.0

## 0.1.34

### Patch Changes

- ca45bfaf: Rework ModelMapper type
- Updated dependencies [7b061ba5]
  - @mds-core/mds-providers@0.2.7

## 0.1.33

### Patch Changes

- Updated dependencies [ccb94996]
  - @mds-core/mds-utils@0.3.1

## 0.1.32

### Patch Changes

- 11b7a478: Export ModelMapper type
- 11b7a478: Changes to support TS 4.5.5
- Updated dependencies [04aca084]
- Updated dependencies [11b7a478]
- Updated dependencies [04aca084]
- Updated dependencies [04aca084]
  - @mds-core/mds-utils@0.3.0
  - @mds-core/mds-types@0.9.0
  - @mds-core/mds-logger@0.5.6
  - @mds-core/mds-providers@0.2.6

## 0.1.31

### Patch Changes

- Updated dependencies [bdf3b09d]
- Updated dependencies [c3627656]
  - @mds-core/mds-utils@0.2.17
  - @mds-core/mds-logger@0.5.5

## 0.1.30

### Patch Changes

- 9e43b468: Add publishConfig for all packages to include a main entry
- Updated dependencies [9e43b468]
  - @mds-core/mds-logger@0.5.4
  - @mds-core/mds-providers@0.2.5
  - @mds-core/mds-types@0.8.2
  - @mds-core/mds-utils@0.2.16

## 0.1.29

### Patch Changes

- 0993473d: Resolve DEP0128 from Node v16 by removing "main" entry from package.json
- Updated dependencies [0993473d]
  - @mds-core/mds-logger@0.5.3
  - @mds-core/mds-providers@0.2.4
  - @mds-core/mds-types@0.8.1
  - @mds-core/mds-utils@0.2.15

## 0.1.28

### Patch Changes

- Updated dependencies [cf4b0ecc]
- Updated dependencies [c6956072]
- Updated dependencies [ad126757]
  - @mds-core/mds-utils@0.2.14
  - @mds-core/mds-types@0.8.0
  - @mds-core/mds-providers@0.2.3

## 0.1.27

### Patch Changes

- Updated dependencies [3fcddef9]
  - @mds-core/mds-providers@0.2.2

## 0.1.26

### Patch Changes

- Updated dependencies [a4fbd91f]
- Updated dependencies [fd6aea05]
  - @mds-core/mds-logger@0.5.2
  - @mds-core/mds-providers@0.2.1
  - @mds-core/mds-utils@0.2.13

## 0.1.25

### Patch Changes

- Updated dependencies [bb63d77f]
  - @mds-core/mds-providers@0.2.0

## 0.1.24

### Patch Changes

- Updated dependencies [a881d6cc]
  - @mds-core/mds-logger@0.5.1
  - @mds-core/mds-utils@0.2.12

## 0.1.23

### Patch Changes

- 102aa5a0: Add a namespace property to all info/warn/error logs
- Updated dependencies [102aa5a0]
  - @mds-core/mds-logger@0.5.0
  - @mds-core/mds-utils@0.2.11

## 0.1.22

### Patch Changes

- d4bd927b: Typeorm now supports generated IDENTITY columns in Postgres

## 0.1.21

### Patch Changes

- Updated dependencies [2cd96944]
- Updated dependencies [add4b114]
- Updated dependencies [85158deb]
- Updated dependencies [c0c8f12f]
  - @mds-core/mds-utils@0.2.10
  - @mds-core/mds-logger@0.4.4
  - @mds-core/mds-providers@0.1.45

## 0.1.20

### Patch Changes

- 70586f15: Meaningless bump to ensure artifacts are built properly
- Updated dependencies [70586f15]
- Updated dependencies [70586f15]
  - @mds-core/mds-utils@0.2.9
  - @mds-core/mds-logger@0.4.3
  - @mds-core/mds-providers@0.1.44
  - @mds-core/mds-types@0.7.1

## 0.1.19

### Patch Changes

- Updated dependencies [a156f493]
  - @mds-core/mds-types@0.7.0
  - @mds-core/mds-providers@0.1.43
  - @mds-core/mds-utils@0.2.8

## 0.1.18

### Patch Changes

- a1061650: Add namespaced logger, clean up excess logger messages
- Updated dependencies [a1061650]
- Updated dependencies [3f5c4358]
  - @mds-core/mds-logger@0.4.2
  - @mds-core/mds-utils@0.2.7
  - @mds-core/mds-types@0.6.1
  - @mds-core/mds-providers@0.1.42

## 0.1.17

### Patch Changes

- Updated dependencies [0a238253]
- Updated dependencies [0a238253]
- Updated dependencies [5c02e73f]
  - @mds-core/mds-types@0.6.0
  - @mds-core/mds-utils@0.2.6
  - @mds-core/mds-providers@0.1.41

## 0.1.16

### Patch Changes

- f501924c: Bump everything due to previous bad release
- Updated dependencies [f501924c]
  - @mds-core/mds-logger@0.4.1
  - @mds-core/mds-providers@0.1.40
  - @mds-core/mds-types@0.5.5
  - @mds-core/mds-utils@0.2.5

## 0.1.15

### Patch Changes

- 81220ee6: Upgrade typeorm and pg dependencies
- Updated dependencies [7bdfdff5]
- Updated dependencies [71a9d1de]
  - @mds-core/mds-types@0.5.4
  - @mds-core/mds-logger@0.4.0
  - @mds-core/mds-providers@0.1.39
  - @mds-core/mds-utils@0.2.4

## 0.1.14

### Patch Changes

- Updated dependencies [5167ec02]
  - @mds-core/mds-types@0.5.3
  - @mds-core/mds-providers@0.1.38
  - @mds-core/mds-utils@0.2.3

## 0.1.13

### Patch Changes

- 15b9d729: Upgrade dependencies
- Updated dependencies [f5403ec3]
- Updated dependencies [c1001aa8]
- Updated dependencies [a0a29a98]
- Updated dependencies [15b9d729]
- Updated dependencies [15b9d729]
  - @mds-core/mds-logger@0.3.0
  - @mds-core/mds-types@0.5.2
  - @mds-core/mds-utils@0.2.2
  - @mds-core/mds-providers@0.1.37

## 0.1.12

### Patch Changes

- Updated dependencies [d8b10031]
  - @mds-core/mds-types@0.5.1
  - @mds-core/mds-providers@0.1.36
  - @mds-core/mds-utils@0.2.1

## 0.1.11

### Patch Changes

- Updated dependencies [61e31276]
  - @mds-core/mds-types@0.5.0
  - @mds-core/mds-utils@0.2.0
  - @mds-core/mds-providers@0.1.35

## 0.1.10

### Patch Changes

- Updated dependencies [9af14cbb]
  - @mds-core/mds-logger@0.2.4
  - @mds-core/mds-utils@0.1.36

## 0.1.9

### Patch Changes

- Updated dependencies [439f92c5]
  - @mds-core/mds-types@0.4.0
  - @mds-core/mds-providers@0.1.34
  - @mds-core/mds-utils@0.1.35

## 0.1.8

### Patch Changes

- Updated dependencies [b6802757]
  - @mds-core/mds-utils@0.1.34

## 0.1.7

### Patch Changes

- Updated dependencies [6609400b]
  - @mds-core/mds-types@0.3.2
  - @mds-core/mds-providers@0.1.33
  - @mds-core/mds-utils@0.1.33

## 0.1.6

### Patch Changes

- Updated dependencies [7e56b9b6]
- Updated dependencies [5eb4121b]
  - @mds-core/mds-providers@0.1.32
  - @mds-core/mds-types@0.3.1
  - @mds-core/mds-utils@0.1.32

## 0.1.5

### Patch Changes

- Updated dependencies [24231359]
- Updated dependencies [93493a19]
  - @mds-core/mds-types@0.3.0
  - @mds-core/mds-utils@0.1.31
  - @mds-core/mds-providers@0.1.31

## 0.1.4

### Patch Changes

- 8ab4569d: Minor patch change for every package to get versioning aligned with changeset workflows
- Updated dependencies [8ab4569d]
  - @mds-core/mds-logger@0.2.3
  - @mds-core/mds-providers@0.1.30
  - @mds-core/mds-types@0.2.1
  - @mds-core/mds-utils@0.1.30

## 0.1.3

### Patch Changes

- Updated dependencies [cc0a3bae]
  - @mds-core/mds-types@0.2.0
  - @mds-core/mds-providers@0.1.29
  - @mds-core/mds-utils@0.1.29
