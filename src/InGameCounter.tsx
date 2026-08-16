import { useMemo, useState } from "react";
import { Check, RotateCcw, Trophy, Undo2 } from "lucide-react";

type Player = "A" | "B";

type ScoreEvent = {
  id: string;
  player: Player;
  points: number;
  aChange: number;
  bChange: number;
};

type MatchResult = {
  playerA: number;
  playerB: number;
};

const uid = () => Math.random().toString(36).slice(2, 9);

export default function InGameCounter() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");

  const [events, setEvents] = useState<ScoreEvent[]>([]);

  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  /*
   * A gets points:
   * A + points
   * B - points
   *
   * B gets points:
   * B + points
   * A - points
   *
   * Negative values automatically reverse the operation.
   */
  const addPoints = (player: Player, points: number) => {
    if (!Number.isInteger(points) || points === 0 || finished) {
      return;
    }

    const aChange = player === "A" ? points : -points;
    const bChange = player === "B" ? points : -points;

    setScoreA((current) => current + aChange);
    setScoreB((current) => current + bChange);

    setEvents((current) => [
      ...current,
      {
        id: uid(),
        player,
        points,
        aChange,
        bChange,
      },
    ]);
  };

  const submitA = () => {
    if (!inputA.trim()) return;

    const points = Number(inputA);

    if (!Number.isInteger(points) || points === 0) {
      return;
    }

    addPoints("A", points);
    setInputA("");
  };

  const submitB = () => {
    if (!inputB.trim()) return;

    const points = Number(inputB);

    if (!Number.isInteger(points) || points === 0) {
      return;
    }

    addPoints("B", points);
    setInputB("");
  };

  /*
   * Undo the most recent event.
   */
  const undoLast = () => {
    if (events.length === 0 || finished) return;

    const last = events[events.length - 1];

    setScoreA((current) => current - last.aChange);
    setScoreB((current) => current - last.bChange);

    setEvents((current) => current.slice(0, -1));
  };

  /*
   * Finish this one match.
   *
   * The result is stored only inside this component.
   * It does NOT modify Tournament or the standings table.
   */
  const finishMatch = () => {
    if (events.length === 0) return;

    setResult({
      playerA: scoreA,
      playerB: scoreB,
    });

    setFinished(true);
  };

  /*
   * Start another in-game match.
   */
  const newMatch = () => {
    setScoreA(0);
    setScoreB(0);
    setInputA("");
    setInputB("");
    setEvents([]);
    setFinished(false);
    setResult(null);
  };

  const total = useMemo(() => scoreA + scoreB, [scoreA, scoreB]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white grid place-items-center">
                <Trophy size={19} />
              </div>

              <div>
                <h2 className="text-xl font-black">In-Game Counting</h2>

                <p className="text-sm text-slate-500">One match • A vs B</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Balance</div>

            <div
              className={`font-black ${
                total === 0 ? "text-emerald-600" : "text-red-600"
              }`}>
              {total > 0 ? "+" : ""}
              {total}
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid md:grid-cols-[1fr_80px_1fr] gap-4 items-center">
        {/* Player A */}
        <div className="card p-6 border-2 border-indigo-200">
          <div className="text-center">
            <p className="text-sm font-black tracking-wider text-indigo-600">
              PLAYER A
            </p>

            <div className="text-7xl font-black mt-2">
              {scoreA > 0 ? "+" : ""}
              {scoreA}
            </div>

            <p className="text-xs text-slate-400 mt-1">MATCH POINTS</p>
          </div>

          <div className="flex gap-2 mt-6">
            <input
              type="number"
              step="1"
              value={inputA}
              disabled={finished}
              placeholder="Points"
              className="input flex-1 text-center"
              onChange={(e) => setInputA(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitA();
                }
              }}
            />

            <button
              type="button"
              disabled={finished}
              className="btn primary"
              onClick={submitA}>
              <Check size={16} />
              Add
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-3">
            Example: <b>5</b> → A +5 / B -5
          </p>
        </div>

        {/* VS */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white grid place-items-center font-black">
            VS
          </div>
        </div>

        {/* Player B */}
        <div className="card p-6 border-2 border-rose-200">
          <div className="text-center">
            <p className="text-sm font-black tracking-wider text-rose-600">
              PLAYER B
            </p>

            <div className="text-7xl font-black mt-2">
              {scoreB > 0 ? "+" : ""}
              {scoreB}
            </div>

            <p className="text-xs text-slate-400 mt-1">MATCH POINTS</p>
          </div>

          <div className="flex gap-2 mt-6">
            <input
              type="number"
              step="1"
              value={inputB}
              disabled={finished}
              placeholder="Points"
              className="input flex-1 text-center"
              onChange={(e) => setInputB(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitB();
                }
              }}
            />

            <button
              type="button"
              disabled={finished}
              className="btn primary"
              onClick={submitB}>
              <Check size={16} />
              Add
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-3">
            Example: <b>5</b> → B +5 / A -5
          </p>
        </div>
      </div>

      {/* Rules */}
      <div className="card p-5">
        <h3 className="font-black mb-3">Counting Rules</h3>

        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-4">
            <b>A gets 5</b>
            <div className="text-slate-500 mt-1">A +5 / B -5</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <b>B gets 5</b>
            <div className="text-slate-500 mt-1">A -5 / B +5</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <b>Correction</b>
            <div className="text-slate-500 mt-1">Use negative points</div>
          </div>
        </div>
      </div>

      {/* Current Match Actions */}
      {!finished && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={events.length === 0}
              onClick={undoLast}
              className="btn ghost disabled:opacity-40">
              <Undo2 size={16} />
              Undo Last
            </button>

            <div className="text-sm text-slate-500">
              {events.length} {events.length === 1 ? "event" : "events"}
            </div>

            <button
              type="button"
              disabled={events.length === 0}
              onClick={finishMatch}
              className="btn primary disabled:opacity-40">
              <Check size={16} />
              Finish Match
            </button>
          </div>
        </div>
      )}

      {/* Event History */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black">Match Events</h3>

          <span className="text-xs text-slate-400">{events.length} total</span>
        </div>

        {events.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            No points recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {[...events].reverse().map((event, index) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 border p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border grid place-items-center text-xs font-black">
                    {events.length - index}
                  </div>

                  <div>
                    <div className="font-bold">Player {event.player}</div>

                    <div className="text-xs text-slate-400">
                      Entered {event.points > 0 ? "+" : ""}
                      {event.points}
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm">
                  <div
                    className={
                      event.aChange > 0
                        ? "text-emerald-600 font-bold"
                        : "text-rose-600 font-bold"
                    }>
                    A {event.aChange > 0 ? "+" : ""}
                    {event.aChange}
                  </div>

                  <div
                    className={
                      event.bChange > 0
                        ? "text-emerald-600 font-bold"
                        : "text-rose-600 font-bold"
                    }>
                    B {event.bChange > 0 ? "+" : ""}
                    {event.bChange}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finished Result */}
      {finished && result && (
        <div className="card p-6 border-2 border-emerald-200 bg-emerald-50">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest font-bold text-emerald-600">
              Match Finished
            </div>

            <h2 className="text-2xl font-black mt-1">Final Result</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white rounded-2xl p-5 text-center">
              <div className="text-sm font-bold text-slate-500">PLAYER A</div>

              <div className="text-5xl font-black text-indigo-600 mt-2">
                {result.playerA > 0 ? "+" : ""}
                {result.playerA}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 text-center">
              <div className="text-sm font-bold text-slate-500">PLAYER B</div>

              <div className="text-5xl font-black text-rose-600 mt-2">
                {result.playerB > 0 ? "+" : ""}
                {result.playerB}
              </div>
            </div>
          </div>

          <div className="text-center mt-5 text-sm">
            <span className="font-bold">
              {result.playerA > 0 ? "+" : ""}
              {result.playerA}
            </span>

            <span className="mx-2">+</span>

            <span className="font-bold">
              {result.playerB > 0 ? "+" : ""}
              {result.playerB}
            </span>

            <span className="mx-2">=</span>

            <span className="font-black text-emerald-600">0</span>
          </div>

          <p className="text-center text-xs text-slate-500 mt-2">
            Match result only. This does not affect the tournament table.
          </p>

          <button
            type="button"
            onClick={newMatch}
            className="btn primary w-full mt-5">
            <RotateCcw size={16} />
            Start New Match
          </button>
        </div>
      )}
    </div>
  );
}
