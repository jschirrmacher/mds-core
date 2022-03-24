# Config API

The Config API provides system-wide configruation and metadata for `organization` assets.  The objects exposed are often organized hierarchichally: organizations contain jurisdictions with associated agencies, jurisdictions contain geographies which represent everything from geofence boundaries to curb assets in the form of stops and spots.

## Get Organizations Endpoint

Provides core information on all configured `organizations`, including their associated jurisdictions, agencies, and published geographies.  Geographies include metadata identifying for example the jurisdiction they are managed by (`jurisidiction_id`), and the type of entity they represent (`geography_type`) which include geofences, significant areas/structures, and curb assets.

Endpoint: `/config/organizations`

Method: `GET`

Auth required: yes

### Example

Request:

```sh
curl --request GET --url 'https://<tenant_url>/config/organizations' --header
'Authorization: Bearer <token>'
```

Response:

```json
[
  {
    "name": "Los Angeles World Airports",
    "locale": "en-US",
    "currency": "USD",
    "timezone": "America/Los_Angeles",
    "agency_key": "lawa",
    "agencies": [
      "lax"
    ],
    "jurisdictions": [
      {
        "jurisdiction_id": "456c9ee5-6a70-4301-9fef-90b89c6d3647",
        "agency_key": "lax",
        "agency_name": "Los Angeles International Airport",
        "geography_id": "df48e850-0b33-4079-ac70-b013fcf9a83a",
        "timestamp": 1611343134427,
        "geographies": [
          {
            "geography_id": "ff727f00-587d-492a-81f0-f60f14492464",
            "name": "Terminal 2",
            "description": null,
            "effective_date": null,
            "publish_date": 1611343134847,
            "prev_geographies": null,
            "geography_json": {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "properties": {},
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                      [
                        [
                          -118.40309679508209,
                          33.94521346274694
                        ],
                        [
                          -118.40314239263535,
                          33.945524974107755
                        ],
                        [
                          -118.40618401765822,
                          33.94522511393433
                        ],
                        [
                          -118.40615451335908,
                          33.94490697608406
                        ],
                        [
                          -118.40309679508209,
                          33.94521346274694
                        ]
                      ]
                    ]
                  }
                }
              ]
            },
            "geography_metadata": {
              "jurisdiction_id": "456c9ee5-6a70-4301-9fef-90b89c6d3647",
              "geography_type": "stop",
              "stop_id": "33857a89-6f9e-4471-b734-e3ca76cc1532"
            }
          },
          {
            "geography_id": "9616426b-d8f2-4fa8-a1db-de6a924ddc58",
            "name": "Spot 5",
            "description": null,
            "effective_date": null,
            "publish_date": 1611343134848,
            "prev_geographies": null,
            "geography_json": {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "properties": {},
                  "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                      [
                        [
                          -118.40367481112479,
                          33.94523015088446
                        ],
                        [
                          -118.40313971042633,
                          33.945280215277386
                        ],
                        [
                          -118.40314641594885,
                          33.94531470406427
                        ],
                        [
                          -118.40367749333383,
                          33.94526575223355
                        ],
                        [
                          -118.40367481112479,
                          33.94523015088446
                        ]
                      ]
                    ]
                  }
                }
              ]
            },
            "geography_metadata": {
              "jurisdiction_id": "456c9ee5-6a70-4301-9fef-90b89c6d3647",
              "geography_type": "spot",
              "spot_id": "201cc9c7-9fc4-42aa-878b-4c663cc63c69"
            }
          }
        ]
      }
    ]
  }
]
```

The properties of an organization include:
| Property           | Type                          | Description |
| -----------     | ----------------------------- | -------- |
| `name` | String | Name of the organization |
| `locale` | String | Language locale name |
| `currency` | String | Currency used by the organization, ISO 4217 code |
| `timezone` | String | Timezone used by the organization, tz database name |
| `agency_key` | String | Unique identifier for the organization |
| `agencies` | String[] | List of agencies within the organization |

Additional properties bundled into each organization for ease of use:
| Property           | Type                          | Description |
| -----------     | ----------------------------- | -------- |
| `jurisdictions` | Jurisdiction[] | List of jurisdictions within the organization.  one-to-one with agencies |
| `jurisdiction.geographies` | Geography[] | List of geographies managed by each jurisdiction
| `jurisdiction.geography.geography_metadata` | Object | Object containing structured metadata for each geography |
