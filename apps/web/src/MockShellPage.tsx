import type { ActiveSession } from "@riskbreaker/app-shell";
import { SessionOrchestrator } from "@riskbreaker/app-shell";
import {
  createVagrantStoryPlugin,
  getFixtureManifest,
  getFixtureRuntimeSnapshot,
} from "@riskbreaker/plugin-vagrant-story";
import type { CommandPlan, ViewModel } from "@riskbreaker/shared-types";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

function vagrantStoryRegistration() {
  const meta = createVagrantStoryPlugin().metadata;
  return { metadata: meta, create: () => createVagrantStoryPlugin() };
}

export default function MockShellPage() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [viewModel, setViewModel] = useState<ViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CommandPlan | null>(null);

  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setSession(null);
    setViewModel(null);
    try {
      const orchestrator = new SessionOrchestrator([vagrantStoryRegistration()], () =>
        getFixtureRuntimeSnapshot(),
      );
      const s = await orchestrator.bootstrap(getFixtureManifest());
      setSession(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setViewModel(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const snap = session.stateStore.getSnapshot();
      if (!snap) {
        return;
      }
      const vm = await session.viewModelBuilder.build(snap);
      if (!cancelled) {
        setViewModel(vm);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const runEquip = useCallback(async () => {
    if (!session) {
      return;
    }
    const p = await session.commandBus.dispatch({
      kind: "EquipItem",
      itemId: "broadsword_rusty",
    });
    setPlan(p);
  }, [session]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem" }}>
      <header>
        <h1 style={{ fontWeight: 600, fontSize: "1.5rem" }}>Riskbreaker</h1>
        <p style={{ color: "#9aa3b8" }}>
          Mock vertical slice: manifest → plugin → decode → inventory view model → command plan.
        </p>
        <p style={{ fontSize: "0.9rem", marginTop: "0.75rem" }}>
          <Link to="/play/spike">Playable spike (WASM PS1 emulator)</Link> — experimental; not
          the mock pipeline.
        </p>
      </header>

      <section className="panel">
        <button type="button" disabled={loading} onClick={() => void startSession()}>
          {loading ? "Starting…" : "Load mock session (Vagrant Story)"}
        </button>
        {error ? <p style={{ color: "#f88" }}>{error}</p> : null}
      </section>

      {session ? (
        <>
          <section className="panel">
            <h2>Manifest</h2>
            <p>
              <strong>{session.manifest.title}</strong> — {session.manifest.titleId} (
              {session.manifest.region})
            </p>
            <p style={{ fontSize: "0.9rem", color: "#9aa3b8" }}>
              Plugin: {session.plugin.metadata.id} · Screens:{" "}
              {session.screenRegistry
                .list()
                .map((s) => s.id)
                .join(", ")}
            </p>
          </section>

          <section className="panel">
            <h2>Inventory (mock view model)</h2>
            {viewModel ? <pre>{JSON.stringify(viewModel, null, 2)}</pre> : <p>Loading…</p>}
          </section>

          <section className="panel">
            <h2>Sample command</h2>
            <button type="button" onClick={() => void runEquip()}>
              Dispatch EquipItem (broadsword_rusty)
            </button>
            {plan ? (
              <div style={{ marginTop: "0.75rem" }}>
                <h3 style={{ fontSize: "1rem" }}>Command plan</h3>
                <pre>{JSON.stringify(plan, null, 2)}</pre>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
