# daRTING

daRTING is a phone-layout dart scorer. One person can practise, or up to eight people can play on the same board. The phone camera shows the board. The player taps the bed that was hit. The app applies that game's rules, speaks the visit, and stores the darts on the phone.

Automatic tip detection is not in this build. The camera is a live view. Scoring happens when a bed is tapped.

Full scoring rules are in [DARTS_HANDBOOK.md](DARTS_HANDBOOK.md). The default game is **501**, straight in, double out.

## What you can do

The bottom bar is on every screen:

| Button | What it opens |
| --- | --- |
| Home | Play, Practice, Leaderboards, and Achievements |
| Games | Every dart game |
| Practice | Darts thrown, 3-dart average, best visit, 180s, tons, checkouts, and recent visits for one player |
| Boards | Leaderboards: highest visit, best 01 average, fewest darts in 501, most 180s, highest High Score, most wins |
| Awards | Achievements. They unlock in the background and do not stop the game |

During a game, **Back** returns home and keeps the visits already stored. **Undo** takes back the last dart.

### Games

Each subgame is its own choice because the play is different.

- **01:** 501, 301, 701, 1001, double in / double out, master out, open out. First to 1, 2, or 3 legs.
- **Cricket:** Cricket, Cut Throat, No Score, Tactics, Mickey Mouse.
- **Around the board:** Around the Clock, Doubles Around, Nine Lives, Accumulator, Ladder, Chase the Dragon, Hare and Hounds.
- **Adding up:** High Score, Average, Race (300, 500, or 1000), 420, Halve It, Bermuda, Shanghai, All Fives.
- **Group:** Killer, Knockout, Beat It, Last One Standing, Follow the Leader, 21, Nine-Dart Century, Gotcha, Elimination, Scram, Golf, Baseball, Bowls, Blackout, Prisoner.
- **Practice:** Bob's 27, 121, JDC 57, Three in a Bed.

Some games need at least two players. The setup screen says so and turns **Just me** off.

### How a visit is entered

1. Open **Games** and pick a game.
2. Choose **Just me** or **More than one**.
3. Set how many players (2–8), their names, and flight colours. Two players start as blue and red.
4. Press **Start**.
5. Choose **Single**, **Double**, or **Treble**, then tap the number. **Bull** is the inner bull (50). **25** is the outer bull. **Miss** scores nothing.
6. After three darts the visit ends on its own. **End visit** ends it early.

The phone speaks lines such as "Score 100. Remaining 401." Speech uses the browser voice. If the browser blocks sound, the same words still appear on the screen.

Checkout help starts when 170 or less is left. The last dart of an 01 leg must follow that game's finish rule. A bust wipes the whole visit.

## What you need

- [Node.js](https://nodejs.org/) 22 or newer. That includes npm.
- A current browser: Chrome, Edge, or the phone's browser.
- A camera is optional. Without one, tap scoring still works.

Check the install:

```powershell
node -v
npm -v
```

Git is only needed if you are cloning the repository. It is not needed to run the app after the files are on the computer.

## Install

Clone the repository, then install the app dependencies. `node_modules` is not in git, so this step is required on every new copy.

```powershell
git clone https://github.com/pawarkiran3991/DART_SCORE.git
cd DART_SCORE
cd app
npm install
```

If the project is already on the computer, skip the clone and run `npm install` inside the `app` folder.

## Run

From the `app` folder:

```powershell
npm run dev
```

Vite prints a local address, usually:

```text
http://127.0.0.1:5173/
```

Open that address. The first screen is Home.

Leave the terminal open while you play. Stop the server with Ctrl+C.

### Open it on a phone

The phone and the computer must be on the same Wi-Fi. Start the server so other devices can reach it:

```powershell
npm run dev -- --host
```

Vite prints a Network address such as `http://192.168.1.20:5173/`. Open that on the phone.

A camera on a phone usually needs a secure page (`https`) or `localhost`. A plain `http://192.168...` address often leaves the camera off. Tap scoring still works on that address. On the computer, `http://127.0.0.1:5173/` is allowed to use a camera.

Allow the camera when the browser asks. The picture is only a preview. It is not saved.

If the camera stays off, the message on the screen says why:

- **No camera was found.** Turn the camera on in Windows under Settings, Privacy & security, Camera, or plug a camera in, then reload.
- **Camera permission is blocked.** Allow the camera for this site, then reload.
- **The camera is in use by another app.** Close that app, then reload.

The app asks for the rear camera first, then any camera.

## Where scores are kept

Visits, finished games, achievements, and leaderboards stay in this browser's local storage on this device. There is no account and no server. Another browser, another phone, or clearing site data starts a fresh record.

Storage keys:

- `darting.visits`
- `darting.matches`
- `darting.achievements`

## Tests and a production build

From the `app` folder:

```powershell
npm test
```

That runs the rules tests (501 scoring, busts, checkouts, double in, cricket marks, and a 180).

Build the static site, then preview it:

```powershell
npm run build
npm run preview
```

The built files are written to `app/dist`.

## Project layout

```text
DARTS_HANDBOOK.md          Scoring rules for every game
README.md                  This guide
app/                       The playable web app
  src/domain/              Rules engines
  src/ui/                  Screens
  src/storage/             Local scores, leaderboards, achievements
.cursor/rules/             Pointer so later work reads the handbook
```

Android and iOS packages are not part of this build. The screens are a phone-width web app so they can be wrapped later.
