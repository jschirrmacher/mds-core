/*
    Copyright 2019-2020 City of Los Angeles.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
 */

import { VEHICLE_STATUS, VEHICLE_EVENT, EVENT_STATUS_MAP } from '@mds-core/mds-types'
import { MessageLabeler } from './types'

export interface VehicleStateLabel {
  vehicle_state: VEHICLE_STATUS
}

export const VehicleStateLabeler: () => MessageLabeler<
  { event_type: VEHICLE_EVENT },
  VehicleStateLabel
> = () => async ({ event_type }) => ({ vehicle_state: EVENT_STATUS_MAP[event_type] })
