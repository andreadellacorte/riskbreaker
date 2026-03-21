# @riskbreaker/domain-engine

Maps **`GameSnapshot`** → **`ViewModel`** through a plugin’s **`IDomainPack`**.

- **`SnapshotMapper`** — delegates to the active pack.
- **`RulesEngine`** — mock allow-all; later: UX / progression gates.
- **`ViewModelBuilder`** — façade used by app-shell.
