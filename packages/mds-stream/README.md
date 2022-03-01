# MDS Stream

Stream interface to be used by MDS packages which need to interact with data-streaming technologies.

## Supported Platforms

Usage of the platforms described below varies throughout MDS-Core, and is based on the nuanced use-cases and characteristics each streaming platform is optimized for.

### Kafka

[Kafka](https://kafka.apache.org/) is useful in cases where data needs to be delivered between highly decoupled services, and durability/persistence as well as delivery guarantees are required. Kafka uses a commit-log system, which enables write (ensuring the write succeeds) & delivery (ensuring subscribed consumers have consumed) guarantees. Unfortunately, Kafka is a bit slower than NATS in terms of end-to-end latency, so sometimes it is not satisfactory for low-latency data transfers. All of these characteristics make Kafka suitable for circumstances where computational accuracy is critical, but latency is more lenient.

#### Example Use Cases for Kafka

- Computing _near_ real-time Metrics
- Computing _near_ real-time Compliance

### NATS

[NATS](https://nats.io/) is useful in cases where data needs to be delivered between things extremely quickly, and there is no concern around durability/persistence and delivery guarantees. NATS is extremely lightweight (uses very little resources) and low latency, but doesn't have any persistence (messages are entirely ephemeral, and only get passed through in-memory), so it's inadequate for any cases where there need to be delivery guarantees and replay-ability.

Note: NATS with JetStream, or NATS Streaming, is more suitable for providing durability and delivery guarantees; however, the development team for mds-core is not currently utilizing these. JetStream was in its infancy when much of mds-stream was designed, and NATS Streaming was inadequate for the team's use-cases due to limited support in external frameworks that were being used.

#### Example Use Cases for NATS

- Displaying real-time dashboards of MDS activity
