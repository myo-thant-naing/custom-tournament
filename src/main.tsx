import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Trophy,
  LayoutDashboard,
  Swords,
  Users,
  Settings2,
  Check,
  RotateCcw,
  Plus,
} from "lucide-react";
import "./index.css";

type Player = { id: string; name: string; groupId: string };
type Group = { id: string; name: string; playerIds: string[] };
type Match = {
  id: string;
  groupId: string;
  p1: string;
  p2: string;
  p1Score?: number;
  p2Score?: number;
  status: "scheduled" | "completed";
};
type Tournament = {
  name: string;
  players: Player[];
  groups: Group[];
  matches: Match[];
  qualifiedPerGroup: number;
};
type Row = {
  player: Player;
  played: number;
  won: number;
  lost: number;
  pts: number;
  pf: number;
  pa: number;
  diff: number;
  opponents: { id: string; result: number }[];
};
const uid = () => Math.random().toString(36).slice(2, 9);
const starter = ["Aung", "Min", "Ko Ko", "Zaw", "Htet", "Myo", "Tun", "Naing"];
function make(name = "Friendly Snooker Cup", n = 8, g = 2, q = 2): Tournament {
  const gs = Array.from({ length: g }, (_, i) => ({
    id: uid(),
    name: `Group ${String.fromCharCode(65 + i)}`,
    playerIds: [] as string[],
  }));
  const ps = Array.from({ length: n }, (_, i) => ({
    id: uid(),
    name: starter[i] ?? `Player ${i + 1}`,
    groupId: "",
  }));
  ps.forEach((p, i) => {
    const x = gs[i % g];
    p.groupId = x.id;
    x.playerIds.push(p.id);
  });
  const ms: Match[] = [];
  gs.forEach((x) => {
    for (let i = 0; i < x.playerIds.length; i++)
      for (let j = i + 1; j < x.playerIds.length; j++)
        ms.push({
          id: uid(),
          groupId: x.id,
          p1: x.playerIds[i],
          p2: x.playerIds[j],
          status: "scheduled",
        });
  });
  return {
    name,
    players: ps,
    groups: gs,
    matches: ms,
    qualifiedPerGroup: Math.max(1, Math.min(q, Math.floor(n / g))),
  };
}
function calc(t: Tournament): Row[] {
  const rows: Row[] = t.players.map((player) => ({
    player,
    played: 0,
    won: 0,
    lost: 0,
    pts: 0,
    pf: 0,
    pa: 0,
    diff: 0,
    opponents: [],
  }));

  const map = new Map(rows.map((row) => [row.player.id, row]));

  for (const match of t.matches) {
    if (
      match.status !== "completed" ||
      match.p1Score === undefined ||
      match.p2Score === undefined
    ) {
      continue;
    }

    const p1 = map.get(match.p1)!;
    const p2 = map.get(match.p2)!;

    const score1 = match.p1Score;
    const score2 = match.p2Score;

    const difference = Math.abs(score1 - score2);

    p1.played++;
    p2.played++;

    if (score1 > score2) {
      // P1 wins
      p1.won++;
      p2.lost++;

      p1.pts += 1;

      // IMPORTANT:
      // Only the difference is recorded.
      p1.pf += difference;
      p2.pa -= difference;

      p1.diff += difference;
      p2.diff -= difference;

      p1.opponents.push({
        id: p2.player.id,
        result: difference,
      });

      p2.opponents.push({
        id: p1.player.id,
        result: -difference,
      });
    } else if (score2 > score1) {
      // P2 wins
      p2.won++;
      p1.lost++;

      p2.pts += 1;

      p2.pf += difference;
      p1.pa -= difference;

      p2.diff += difference;
      p1.diff -= difference;

      p1.opponents.push({
        id: p2.player.id,
        result: -difference,
      });

      p2.opponents.push({
        id: p1.player.id,
        result: difference,
      });
    }
  }

  return rows;
}
function h2h(a: Row, b: Row): number {
  return (
    a.opponents.find((opponent) => opponent.id === b.player.id)?.result ?? 0
  );
}

function sorter(a: Row, b: Row): number {
  // 1. Points
  if (a.pts !== b.pts) {
    return b.pts - a.pts;
  }

  // 2. Difference
  if (a.diff !== b.diff) {
    return b.diff - a.diff;
  }

  // 3. PF
  if (a.pf !== b.pf) {
    return b.pf - a.pf;
  }

  // 4. PA
  // Higher PA is better because PA is negative.
  // Example: -10 is better than -20.
  if (a.pa !== b.pa) {
    return b.pa - a.pa;
  }

  // 5. Head-to-Head
  const result = h2h(a, b);

  if (result !== 0) {
    return result > 0 ? -1 : 1;
  }

  // Final stable fallback
  return a.player.name.localeCompare(b.player.name);
}
function App() {
  const navigation = [
    {
      key: "dashboard",
      icon: LayoutDashboard,
      label: "Overview",
    },
    {
      key: "matches",
      icon: Swords,
      label: "Matches",
    },
    {
      key: "players",
      icon: Users,
      label: "Players",
    },
    {
      key: "settings",
      icon: Settings2,
      label: "Tournament",
    },
  ];
  const [t, setT] = useState<Tournament>(() => {
    const x = localStorage.getItem("bp");
    return x ? JSON.parse(x) : make();
  });
  const [tab, setTab] = useState("dashboard");
  useEffect(() => localStorage.setItem("bp", JSON.stringify(t)), [t]);
  const rows = useMemo(() => calc(t), [t]);
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto h-16 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white grid place-items-center">
              <Trophy size={18} />
            </div>
            <b>BreakPoint</b>
          </div>
          <button className="btn primary" onClick={() => setTab("settings")}>
            <Settings2 size={16} /> Configure
          </button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-5 grid lg:grid-cols-[210px_1fr] gap-6">
        <aside>
          <nav className="card p-2">
            {navigation.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex gap-3 p-3 rounded-xl text-sm font-bold ${
                  tab === key
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600"
                }`}>
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <main>
          <h1 className="text-2xl font-black mb-1">{t.name}</h1>
          <p className="text-sm text-slate-500 mb-6">
            Win = 1 PT • Ranking: PT → Diff → PF → PA → Head-to-Head
          </p>
          {tab === "dashboard" && <Dashboard t={t} rows={rows} />}{" "}
          {tab === "matches" && <Matches t={t} setT={setT} />}{" "}
          {tab === "players" && <Players t={t} setT={setT} />}{" "}
          {tab === "settings" && <Settings t={t} setT={setT} />}
        </main>
      </div>
    </div>
  );
}
function Dashboard({ t, rows }: { t: Tournament; rows: Row[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-black mb-4">Standings</h2>
      {t.groups.map((g) => (
        <div key={g.id} className="mb-7">
          <div className="flex justify-between mb-2">
            <b>{g.name}</b>
            <span className="badge bg-indigo-50 text-indigo-700">
              Top {t.qualifiedPerGroup} qualify
            </span>
          </div>
          <Table
            rows={rows.filter((r) => r.player.groupId === g.id).sort(sorter)}
            qualified={t.qualifiedPerGroup}
          />
          s
        </div>
      ))}
      <div className="p-4 rounded-2xl bg-indigo-50 text-sm">
        <b>Scoring:</b> A 50–40 B means A PF +10, B PA −10, Diff +10/−10. Actual
        frame scores are never added to PF/PA.
      </div>
    </div>
  );
}
function Table({ rows, qualified }: { rows: Row[]; qualified: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {[
              "#",
              "Player",
              "P",
              "W",
              "L",
              "PT",
              "PF",
              "PA",
              "Diff",
              "Status",
            ].map((x) => (
              <th className="p-3 text-center" key={x}>
                {x}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => {
            const isQualified = i < qualified;

            return (
              <tr
                key={r.player.id}
                className={`
                  border-t transition
                  ${
                    isQualified
                      ? "bg-green-50 border-l-4 border-l-green-500"
                      : ""
                  }
                `}>
                <td className="p-3 text-center font-bold">{i + 1}</td>

                <td className="p-3 text-left font-bold">
                  <div className="flex items-center gap-2">
                    {r.player.name}

                    {isQualified && (
                      <span className="badge bg-green-100 text-green-700">
                        QUALIFIED
                      </span>
                    )}
                  </div>
                </td>

                <td className="text-center">{r.played}</td>

                <td className="text-center">{r.won}</td>

                <td className="text-center">{r.lost}</td>

                <td className="text-center font-black">{r.pts}</td>

                <td className="text-center">{r.pf}</td>

                <td className="text-center">{r.pa}</td>

                <td
                  className={`
                    text-center font-black
                    ${
                      r.diff > 0
                        ? "text-emerald-600"
                        : r.diff < 0
                          ? "text-rose-600"
                          : ""
                    }
                  `}>
                  {r.diff > 0 ? "+" : ""}
                  {r.diff}
                </td>

                <td className="text-center">
                  {isQualified ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function Matches({
  t,
  setT,
}: {
  t: Tournament;
  setT: React.Dispatch<React.SetStateAction<Tournament>>;
}) {
  return (
    <div className="space-y-5">
      {t.groups.map((g) => (
        <section className="card p-5" key={g.id}>
          <h2 className="font-black mb-4">{g.name}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {t.matches
              .filter((m) => m.groupId === g.id)
              .map((m) => (
                <Match key={m.id} m={m} t={t} setT={setT} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
function Match({
  m,
  t,
  setT,
}: {
  m: Match;
  t: Tournament;
  setT: React.Dispatch<React.SetStateAction<Tournament>>;
}) {
  const player1 = t.players.find((p) => p.id === m.p1)!;
  const player2 = t.players.find((p) => p.id === m.p2)!;

  const [score1, setScore1] = useState(
    m.p1Score !== undefined ? String(m.p1Score) : "",
  );

  const [score2, setScore2] = useState(
    m.p2Score !== undefined ? String(m.p2Score) : "",
  );

  const [error, setError] = useState("");

  const saveScore = () => {
    setError("");

    if (score1.trim() === "" || score2.trim() === "") {
      setError("Please enter both scores.");
      return;
    }

    const value1 = Number(score1);
    const value2 = Number(score2);

    if (!Number.isInteger(value1) || !Number.isInteger(value2)) {
      setError("Scores must be whole numbers.");
      return;
    }

    if (value1 < 0 || value2 < 0) {
      setError("Score cannot be negative.");
      return;
    }

    // A one-frame match cannot be tied.
    if (value1 === value2) {
      setError("The match cannot be a draw.");
      return;
    }

    setT((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === m.id
          ? {
              ...match,
              p1Score: value1,
              p2Score: value2,
              status: "completed",
            }
          : match,
      ),
    }));
  };

  const difference =
    score1 !== "" && score2 !== "" && Number(score1) !== Number(score2)
      ? Math.abs(Number(score1) - Number(score2))
      : null;

  return (
    <div className="border rounded-2xl p-4">
      <div className="font-bold mb-3">
        {player1.name}
        <span className="text-slate-400 mx-2">vs</span>
        {player2.name}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500">{player1.name}</label>

          <input
            className="input text-center mt-1"
            type="number"
            min="0"
            step="1"
            value={score1}
            onChange={(e) => {
              setScore1(e.target.value);
              setError("");
            }}
            placeholder="Score"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500">{player2.name}</label>

          <input
            className="input text-center mt-1"
            type="number"
            min="0"
            step="1"
            value={score2}
            onChange={(e) => {
              setScore2(e.target.value);
              setError("");
            }}
            placeholder="Score"
          />
        </div>
      </div>

      {difference !== null && (
        <div className="text-center text-sm mt-3 font-bold text-indigo-600">
          Difference: {difference}
        </div>
      )}

      {error && (
        <div className="text-center text-sm mt-2 text-red-600 font-semibold">
          {error}
        </div>
      )}

      <button
        type="button"
        className="btn primary w-full mt-3"
        onClick={saveScore}>
        <Check size={16} />

        {m.status === "completed" ? "Update Score" : "Record Score"}
      </button>

      {m.status === "completed" && (
        <div className="text-center text-xs text-emerald-600 font-semibold mt-2">
          ✓ Score saved
        </div>
      )}
    </div>
  );
}
function Players({
  t,
  setT,
}: {
  t: Tournament;
  setT: React.Dispatch<React.SetStateAction<Tournament>>;
}) {
  const [edit, setEdit] = useState<string | null>(null);
  const add = () => {
    if (t.players.length >= 32) return;
    const g = t.groups[t.players.length % t.groups.length],
      p = { id: uid(), name: `Player ${t.players.length + 1}`, groupId: g.id };
    setT((v) => ({
      ...v,
      players: [...v.players, p],
      groups: v.groups.map((x) =>
        x.id === g.id ? { ...x, playerIds: [...x.playerIds, p.id] } : x,
      ),
    }));
  };
  return (
    <div className="card p-5">
      <div className="flex justify-between mb-4">
        <b>Players</b>
        <button className="btn primary" onClick={add}>
          <Plus size={16} /> Add
        </button>
      </div>
      {t.groups.map((g) => (
        <div className="border rounded-2xl p-4 mb-3" key={g.id}>
          <b>{g.name}</b>
          {g.playerIds.map((pid) => {
            const p = t.players.find((x) => x.id === pid)!;
            return edit === pid ? (
              <input
                autoFocus
                className="input mt-2"
                defaultValue={p.name}
                onBlur={(e) => {
                  setT((v) => ({
                    ...v,
                    players: v.players.map((z) =>
                      z.id === pid
                        ? { ...z, name: e.target.value || z.name }
                        : z,
                    ),
                  }));
                  setEdit(null);
                }}
              />
            ) : (
              <button
                className="block w-full text-left bg-slate-50 rounded-xl p-3 mt-2 font-semibold"
                onClick={() => setEdit(pid)}>
                {p.name}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
function Settings({
  t,
  setT,
}: {
  t: Tournament;
  setT: React.Dispatch<React.SetStateAction<Tournament>>;
}) {
  const [n, setN] = useState(t.players.length),
    [g, setG] = useState(t.groups.length),
    [q, setQ] = useState(t.qualifiedPerGroup),
    [name, setName] = useState(t.name);
  const apply = () =>
    setT(
      make(
        name || "Friendly Snooker Cup",
        Math.max(2, n),
        Math.min(g, n),
        Math.min(q, Math.floor(n / g) || 1),
      ),
    );
  return (
    <div className="card p-5 max-w-2xl">
      <h2 className="font-black text-lg">Custom Tournament</h2>
      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <label className="sm:col-span-2 text-sm font-bold">
          Name
          <input
            className="input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm font-bold">
          Players
          <input
            className="input mt-1"
            type="number"
            min="2"
            max="32"
            value={n}
            onChange={(e) => setN(+e.target.value)}
          />
        </label>
        <label className="text-sm font-bold">
          Groups
          <input
            className="input mt-1"
            type="number"
            min="1"
            max={n}
            value={g}
            onChange={(e) => setG(+e.target.value)}
          />
        </label>
        <label className="text-sm font-bold">
          Qualified / group
          <input
            className="input mt-1"
            type="number"
            min="1"
            value={q}
            onChange={(e) => setQ(+e.target.value)}
          />
        </label>
      </div>
      <p className="bg-slate-50 rounded-xl p-4 text-sm mt-5">
        <b>Ranking:</b> PT → Diff → PF → PA → Head-to-Head.
      </p>
      <button className="btn primary mt-5" onClick={apply}>
        Create Tournament
      </button>
      <button className="btn ghost mt-5 ml-2" onClick={() => setT(make())}>
        <RotateCcw size={16} /> Reset
      </button>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
