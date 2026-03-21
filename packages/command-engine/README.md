# @riskbreaker/command-engine

Turns **`CommandIntent`** into **`CommandPlan`** using the active plugin’s **`ICommandPack`**.

- **`CommandTranslator`** — calls `plan()`.
- **`PolicyEngine`** / **`MacroEngine`** — mocks for future gating and macro expansion.
- **`CommandBus`** — single entry used by app-shell.
