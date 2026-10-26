import { useEffect, useReducer, useRef, useState } from "react";
import { COLOURS, GAMES, createEngine, gameById, groups, type GameDef } from "../domain/catalog";
import type { Engine } from "../domain/engine";
import { SEGMENT_ORDER, type DartHit, type Ring, type Seat } from "../domain/hit";
import {
  achievements,
  forgetLastVisit,
  leaderboards,
  practiceFor,
  practiceNames,
  rememberMatch,
  rememberVisit,
  type Achievement,
} from "../storage/db";
import { speak } from "./speech";

type Screen = "home" | "games" | "setup" | "match" | "practice" | "boards" | "badges";

interface Draft {
  id: string;
  name: string;
  color: string;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [gameId, setGameId] = useState("x01-501");
  const [players, setPlayers] = useState<Draft[]>([draft(0), draft(1)]);
  const [legs, setLegs] = useState(2);
  const [race, setRace] = useState(500);
  const [toast, setToast] = useState("");
  const [tick, bump] = useReducer((n: number) => n + 1, 0);
  const engineRef = useRef<Engine | null>(null);
  const said = useRef("");
  const saved = useRef(false);

  const game = gameById(gameId);
  const engine = engineRef.current;
  const view = engine?.view();

  useEffect(() => {
    if (!engine || !view) return;
    const key = `${engine.commits}:${view.say}`;
    if (view.say && key !== said.current) {
      said.current = key;
      speak(view.say);
    }
    if (view.over && !saved.current) {
      saved.current = true;
      show(rememberMatch(engine.result(true)));
    }
  }, [tick, engine, view]);

  function show(badges: Achievement[]) {
    const first = badges[0];
    if (!first) return;
    setToast(`${first.playerName}: ${first.title}`);
    window.setTimeout(() => setToast(""), 2800);
  }

  function openGame(next: GameDef) {
    setGameId(next.id);
    setPlayers(next.min <= 1 ? [draft(0)] : [draft(0), draft(1)]);
    setScreen("setup");
  }

  function start() {
    const seats: Seat[] = players.slice(0, Math.max(game.min, players.length)).map((player, index) => ({
      id: player.id,
      name: player.name.trim() || `Player ${index + 1}`,
      color: player.color,
    }));
    if (seats.length < game.min) return;
    saved.current = false;
    said.current = "";
    engineRef.current = createEngine(game.id, seats, {
      legsToWin: legs,
      raceTarget: race,
      solo: seats.length === 1,
    });
    bump();
    setScreen("match");
  }

  function leave() {
    const current = engineRef.current;
    if (current && !saved.current) {
      saved.current = true;
      show(rememberMatch(current.result(current.view().over)));
    }
    engineRef.current = null;
    setScreen("home");
  }

  return (
    <main className="shell">
      {toast && <p className="toast">{toast}</p>}
      {screen === "home" && <Home onPlay={() => setScreen("games")} onPractice={() => setScreen("practice")} onBoards={() => setScreen("boards")} onBadges={() => setScreen("badges")} />}
      {screen === "games" && <Games onBack={() => setScreen("home")} onPick={openGame} />}
      {screen === "setup" && (
        <Setup
          game={game}
          players={players}
          legs={legs}
          race={race}
          onPlayers={setPlayers}
          onLegs={setLegs}
          onRace={setRace}
          onBack={() => setScreen("games")}
          onStart={start}
        />
      )}
      {screen === "match" && view && engine && (
        <Match
          engine={engine}
          onChange={() => bump()}
          onVisit={(event) => {
            const current = engineRef.current;
            if (!current || !event) return;
            show(rememberVisit(current.gameId, current.title, event));
          }}
          onUndo={(rolled) => {
            if (rolled) forgetLastVisit();
            bump();
          }}
          onLeave={leave}
        />
      )}
      {screen === "practice" && <Practice onBack={() => setScreen("home")} />}
      {screen === "boards" && <Boards onBack={() => setScreen("home")} />}
      {screen === "badges" && <Badges onBack={() => setScreen("home")} />}
    </main>
  );
}

function Home(props: { onPlay: () => void; onPractice: () => void; onBoards: () => void; onBadges: () => void }) {
  return (
    <section className="page">
      <p className="mark">daRTING</p>
      <h1>Score the board in front of you.</h1>
      <p className="lede">Pick a game, say who is playing, then keep the camera on the board. Tap each dart. Scores, visits, and achievements stay on this phone.</p>
      <button className="primary" onClick={props.onPlay}>Play</button>
      <button onClick={props.onPractice}>Practice</button>
      <button onClick={props.onBoards}>Leaderboards</button>
      <button onClick={props.onBadges}>Achievements</button>
    </section>
  );
}

function Games(props: { onBack: () => void; onPick: (game: GameDef) => void }) {
  return (
    <section className="page">
      <button className="text" onClick={props.onBack}>Back</button>
      <h1>Choose a game</h1>
      {groups().map((group) => (
        <div key={group}>
          <h2>{group}</h2>
          {GAMES.filter((game) => game.group === group).map((game) => (
            <button key={game.id} className="game" onClick={() => props.onPick(game)}>
              <strong>{game.title}</strong>
              <span>{game.blurb}</span>
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}

function Setup(props: {
  game: GameDef;
  players: Draft[];
  legs: number;
  race: number;
  onPlayers: (players: Draft[]) => void;
  onLegs: (legs: number) => void;
  onRace: (race: number) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const many = props.players.length > 1;
  function setCount(count: number) {
    const next = Array.from({ length: count }, (_, index) => props.players[index] ?? draft(index));
    props.onPlayers(next);
  }
  return (
    <section className="page">
      <button className="text" onClick={props.onBack}>Back</button>
      <h1>{props.game.title}</h1>
      <p className="lede">{props.game.blurb}</p>
      <div className="row">
        <button className={!many ? "on" : ""} disabled={props.game.min > 1} onClick={() => setCount(1)}>Just me</button>
        <button className={many ? "on" : ""} onClick={() => setCount(Math.max(2, props.game.min))}>More than one</button>
      </div>
      {props.game.min > 1 && <p className="hint">This game needs at least {props.game.min} players.</p>}
      {many && (
        <label className="field">
          How many players
          <select value={props.players.length} onChange={(event) => setCount(Number(event.target.value))}>
            {Array.from({ length: 7 }, (_, index) => index + 2).filter((count) => count >= props.game.min).map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </label>
      )}
      {props.players.map((player, index) => (
        <div className="player" key={player.id}>
          <span className="swatch" style={{ background: player.color }} />
          <input
            aria-label={`Name for player ${index + 1}`}
            value={player.name}
            onChange={(event) => {
              const next = props.players.slice();
              next[index] = { ...player, name: event.target.value };
              props.onPlayers(next);
            }}
          />
          <select
            aria-label={`Colour for ${player.name}`}
            value={player.color}
            onChange={(event) => {
              const next = props.players.slice();
              next[index] = { ...player, color: event.target.value };
              props.onPlayers(next);
            }}
          >
            {COLOURS.map((colour) => (
              <option key={colour.hex} value={colour.hex}>{colour.name}</option>
            ))}
          </select>
        </div>
      ))}
      {props.game.legs && (
        <div className="row">
          {[1, 2, 3].map((count) => (
            <button key={count} className={props.legs === count ? "on" : ""} onClick={() => props.onLegs(count)}>
              First to {count}
            </button>
          ))}
        </div>
      )}
      {props.game.race && (
        <div className="row">
          {[300, 500, 1000].map((target) => (
            <button key={target} className={props.race === target ? "on" : ""} onClick={() => props.onRace(target)}>
              {target}
            </button>
          ))}
        </div>
      )}
      <button className="primary" onClick={props.onStart}>Start</button>
    </section>
  );
}

function Match(props: {
  engine: Engine;
  onChange: () => void;
  onVisit: (event: ReturnType<Engine["dart"]>) => void;
  onUndo: (rolled: boolean) => void;
  onLeave: () => void;
}) {
  const view = props.engine.view();
  const [ring, setRing] = useState<Ring>("S");
  function throwDart(hit: DartHit) {
    if (view.over) return;
    const event = props.engine.dart(hit);
    props.onVisit(event);
    props.onChange();
  }
  return (
    <section className="match">
      <Camera />
      <div className="score">
        <header>
          <button className="text" onClick={props.onLeave}>Leave</button>
          <strong>{view.title}</strong>
          <button className="text" onClick={() => props.onUndo(props.engine.undo())}>Undo</button>
        </header>
        <div className="cards">
          {view.cards.map((card) => (
            <article key={card.id} className={card.active ? "card on" : "card"} style={{ borderColor: card.color }}>
              <span className="who" style={{ color: card.color }}>{card.name}</span>
              <b>{card.primary}</b>
              <small>{card.secondary}</small>
            </article>
          ))}
        </div>
        <p className="message">{view.message}</p>
        <div className="chips">{view.visit.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
        <div className="row rings">
          {(["S", "D", "T"] as Ring[]).map((value) => (
            <button key={value} className={ring === value ? "on" : ""} onClick={() => setRing(value)}>
              {value === "S" ? "Single" : value === "D" ? "Double" : "Treble"}
            </button>
          ))}
        </div>
        <div className="board">
          {SEGMENT_ORDER.map((number) => (
            <button key={number} onClick={() => throwDart({ number, ring })}>{number}</button>
          ))}
        </div>
        <div className="row">
          <button onClick={() => throwDart({ number: 50, ring: "D" })}>Bull</button>
          <button onClick={() => throwDart({ number: 25, ring: "S" })}>25</button>
          <button onClick={() => throwDart({ number: 0, ring: "S" })}>Miss</button>
          <button onClick={() => { props.onVisit(props.engine.finishVisit()); props.onChange(); }}>End visit</button>
        </div>
        <p className="hint">Tap the bed you hit. The camera shows the board and does not score by itself yet.</p>
      </div>
    </section>
  );
}

function cameraNote(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera was found. Plug one in or allow it in Windows privacy settings, then reload.";
  }
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera permission is blocked. Allow the camera for this site, then reload.";
  }
  if (name === "NotReadableError") {
    return "The camera is in use by another app. Close that app, then reload.";
  }
  return "Camera is off. Tap the board to score.";
}

async function openCamera(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    { video: true, audio: false },
  ];
  let last: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      last = error;
    }
  }
  throw last;
}

function Camera() {
  const video = useRef<HTMLVideoElement>(null);
  const [note, setNote] = useState("Point the phone at the whole board.");
  useEffect(() => {
    let stream: MediaStream | null = null;
    let gone = false;
    const videoEl = video.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      setNote("This browser has no camera. Tap the board to score.");
      return;
    }
    openCamera()
      .then((next) => {
        if (gone) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = next;
        if (videoEl) videoEl.srcObject = next;
        setNote("Camera on. Tap the bed you hit.");
      })
      .catch((error: unknown) => {
        if (!gone) setNote(cameraNote(error));
      });
    return () => {
      gone = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  return (
    <div className="camera">
      <video ref={video} autoPlay playsInline muted />
      <p>{note}</p>
    </div>
  );
}

function Practice(props: { onBack: () => void }) {
  const names = practiceNames();
  const [name, setName] = useState(names[0] ?? "");
  const stats = name ? practiceFor(name) : null;
  return (
    <section className="page">
      <button className="text" onClick={props.onBack}>Back</button>
      <h1>Practice</h1>
      {names.length === 0 && <p className="lede">Play a game and every visit will show up here.</p>}
      {names.length > 0 && (
        <label className="field">
          Player
          <select value={name} onChange={(event) => setName(event.target.value)}>
            {names.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      )}
      {stats && (
        <>
          <div className="stats">
            <Stat label="Darts" value={String(stats.darts)} />
            <Stat label="Average" value={stats.average.toFixed(1)} />
            <Stat label="Best visit" value={String(stats.best)} />
            <Stat label="180s" value={String(stats.maximums)} />
            <Stat label="Tons" value={String(stats.tons)} />
            <Stat label="Checkouts" value={String(stats.checkouts)} />
          </div>
          <h2>Recent visits</h2>
          {stats.recent.map((visit) => (
            <p key={visit.id} className="line">{visit.gameTitle} · {visit.labels.join(" ")} · {visit.bust ? "Bust" : visit.total}</p>
          ))}
        </>
      )}
    </section>
  );
}

function Boards(props: { onBack: () => void }) {
  const boards = leaderboards();
  return (
    <section className="page">
      <button className="text" onClick={props.onBack}>Back</button>
      <h1>Leaderboards</h1>
      {boards.map((board) => (
        <div key={board.title}>
          <h2>{board.title}</h2>
          {board.rows.length === 0 && <p className="hint">Nothing stored yet.</p>}
          {board.rows.map((row) => (
            <p key={`${board.title}-${row.name}-${row.value}`} className="line"><b>{row.value}</b> {row.name} <span>{row.detail}</span></p>
          ))}
        </div>
      ))}
    </section>
  );
}

function Badges(props: { onBack: () => void }) {
  const rows = achievements();
  return (
    <section className="page">
      <button className="text" onClick={props.onBack}>Back</button>
      <h1>Achievements</h1>
      <p className="lede">These unlock while you play. Nothing stops the game.</p>
      {rows.length === 0 && <p className="hint">None yet.</p>}
      {rows.map((badge) => (
        <p key={`${badge.id}-${badge.playerName}`} className="line"><b>{badge.title}</b> {badge.playerName} <span>{badge.detail}</span></p>
      ))}
    </section>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div>
      <b>{props.value}</b>
      <span>{props.label}</span>
    </div>
  );
}

function draft(index: number): Draft {
  const colour = COLOURS[index] ?? COLOURS[0]!;
  return { id: `p${index}-${colour.name}`, name: index === 0 ? "Blue" : colour.name, color: colour.hex };
}
