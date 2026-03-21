# @riskbreaker/state-engine

Normalizes **`RuntimeSnapshot`** → **`GameSnapshot`** using **`IStateDecoder`** from whichever plugin owns the session.

- **`DecoderRegistry`** — optional multi-decoder registration.
- **`StateStore`** — single active decoder + latest snapshot.
- **`diffGameSnapshots`** — shallow diff for devtools / tests.

No game titles or plugin packages are imported here.
