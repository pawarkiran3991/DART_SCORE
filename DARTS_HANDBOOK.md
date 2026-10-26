# daRTING — Dart Game Rules

Source of truth for this project. Read this file before answering rules questions or building game logic. Do not ask the user to restate rules that are already written here.

This project is a **phone camera scorer** with a game menu. This file stores how each game is scored and how the app must behave. It does not cover boards, oches, dress, tournaments, leagues, or federation administration.

- Status: planned. No app has been built yet.
- The home screen is a **game menu**. 301, 501, 701, and 1001 are all on it, with the group games below.
- Default if the player just starts: **501**, straight in, double out.
- Two players default to blue darts and red darts. A group can add more players, each with their own flight colour.
- Where pubs play a game differently, use the default in this file unless the user picks a variant.
- If a rule changes, update this file and the change log in the same session.

## Index

1. [Project log](#1-project-log)
2. [The app](#2-the-app)
3. [The board, as the game sees it](#3-the-board-as-the-game-sees-it)
4. [A visit](#4-a-visit)
5. [Gameplay index](#5-gameplay-index)
6. [X01 — 501 and the countdown games](#6-x01--501-and-the-countdown-games)
7. [Cricket](#7-cricket)
8. [Race games](#8-race-games)
9. [Round games](#9-round-games)
10. [Elimination games](#10-elimination-games)
11. [Practice games](#11-practice-games)
12. [More than two players](#12-more-than-two-players)
13. [Checkout chart, 170 to 2](#13-checkout-chart-170-to-2)
14. [What the game should remember](#14-what-the-game-should-remember)
15. [Rule switches](#15-rule-switches)
16. [Glossary](#16-glossary)
17. [Change log](#17-change-log)

---

## 1. Project log

| Date | Decision |
| --- | --- |
| 2026-10-26 | Handbook created for dart rules. |
| 2026-10-26 | Scope cut to the dart game only. No equipment, setup, tournament, or federation material. |
| 2026-10-26 | The product is a phone-camera 501 scorer for two players, blue darts and red darts. Camera finds the point. Rules engine subtracts, speaks the visit, and calls busts and checkouts. |
| 2026-10-26 | The app has a game menu: 301, 501, 701, 1001, High Score, Average, Race, Cricket, and the group games. The camera is shared. Each game has its own rules. |
| 2026-10-26 | Pub lists were checked. Dart subgames that play differently were kept. Football, Tic-Tac-Toe, and English Cricket were removed. |
| 2026-10-26 | The playable app is the web app in `app/`. Flutter is not installed on this machine, so the first build is Vite, React, and TypeScript, with a phone layout that can be wrapped later. The camera shows the board. The player taps the bed. Automatic tip detection is not in this build. Visits, match results, achievements, and leaderboards stay in the phone's local storage. |

## 2. The app

### What it is

A mobile app. One phone sits on a stand and films the whole dartboard. The player picks a game, then says who is playing, alone or with up to eight people. The current playable build is the web app in `app/`. It uses the phone camera as a live view and scores each dart when the player taps the bed. Automatic scoring is not part of this build. The same screens are meant to be packaged later as an Android APK and an iOS app. Flutter was the packaging plan; it is not installed here, so the rules and the screen are in the web app first.

- Each player has a flight colour: blue, red, green, yellow, black, white, orange, or purple. Two players default to blue and red.
- A team shares one score. Each person on the team still has their own colour, so the camera can see who threw.
- Up to **8** players in one game.
- The camera only reports the point and the colour. The selected game's rules decide the score and the words to speak.

### Game menu

Only dart games. Each main game has its own subgames, and a subgame is a separate choice because the play is different. The camera does not change. The selected game does.

**01, the main countdown.** Subtract from the start. Checkout speech starts at 170 or less. The last dart follows the finish rule of the subgame.

| Subgame | How it plays |
| --- | --- |
| 501 | Start at 501. Straight in, double out. This is the default. |
| 301 | Same rules, start at 301. |
| 701 | Same rules, start at 701. |
| 1001 | Same rules, start at 1001. |
| Double in, double out | Scoring starts only on a double or the inner bull, and the leg ends the same way. Usual start is 301. |
| Master out | Straight in. The winning dart may be a double, a treble, or the inner bull. |
| Open out | Straight in. Any scoring dart can hit exactly 0. |

**Cricket and its subgames.** Marks on the cricket numbers. The scoring changes between them.

| Subgame | How it plays |
| --- | --- |
| Cricket | Close 15–20 and the bull. Points score on numbers the others have not closed. Also called American Cricket. |
| Cut Throat | Same closes. Points go onto opponents who are still open. Lowest score wins. |
| No Score | First to close the seven targets. No points. |
| Tactics | Cricket on 10–20 and the bull. |
| Mickey Mouse | Close 20 down through 12, and the bull. No points. |

**Around the board and its subgames.** Move on a sequence. Missing does something different in each one.

| Subgame | How it plays |
| --- | --- |
| Around the Clock | Hit 1 through 20 in order, then any bull. A miss stays put. |
| Doubles Around | Only the double counts. |
| Nine Lives | Around the Clock with 3 lives. A visit with no hit costs a life. |
| Accumulator | Miss the whole visit and go back to 1. |
| Ladder | Miss the whole visit and drop one number. |
| Chase the Dragon | Trebles only, T10 through T20, then the inner bull. |
| Hare and Hounds | The hare runs clockwise from 20. A hound wins by landing on the hare's number. |

**Adding up and its subgames.** Every dart scores. Nothing uses a double finish.

| Subgame | How it plays |
| --- | --- |
| High Score | 8 visits. Highest total wins. |
| Average | 10 visits. Highest 3-dart average wins. Average is the total divided by the visits. |
| Race | Count up to 500, or 300 or 1000. Finish the round. Highest total wins. |
| 420 | Count up to exactly 420. Landing on 100, 200, 300, or 400 drops back a hundred. |
| Halve It | Hit the round's target or the score is halved. |
| Bermuda | Halve It on the 13-round Bermuda list. |
| Shanghai | One number per round. Single, double, and treble in one visit wins at once. |
| All Fives | A visit scores only when its total divides by 5. First to exactly 51. |

**Group dart games.** Each one is its own game, not a copy of 501.

Killer, Knockout, Beat It, Last One Standing, Follow the Leader, 21, Nine-Dart Century, Gotcha, Elimination, Scram, Golf, Baseball, Bowls, Blackout, Prisoner.

**Practice.** Bob's 27, 121, JDC Challenge, Three in a Bed.

The rules for each name are in the sections below.

### What the phone says

Speech is short. Say the visit total first, then what is left.

Three darts cannot score 1000. The highest visit is **180**. A visit of single 20, single 20, and treble 20 is **100**.

| Moment | Example of what to say |
| --- | --- |
| Three darts total 100, from 501 | "Score 100. Remaining 401." |
| Visit is 180 | "Score 180. Remaining 321." |
| Remaining is 170 or less after a visit | "Remaining 100. Treble 20, double 20. The last dart must be in the double ring." |
| During that finish, after the first dart hits T20 | "Remaining 40. Double 20. The last dart must be in the double ring." |
| Winning dart is a double | "Game shot. Blue wins." |
| Visit would go below 0, hit 0 on a single, or leave 1 | "Bust. No score. Still 32." |
| Dart misses or bounces | "No score on that dart." |
| Dart falls out before it is pulled | "That dart fell out. It does not count." |
| High Score, visit of 100 | "Score 100. Total 480." |
| Average, after 10 visits totalling 600 | "Average 60." |
| Race, someone passes 500 | "Round complete. Blue leads with 512." |
| Red dart appears on Blue's turn | "Wrong colour. That dart is red." |
| Tip is on a wire or hidden | "Check this dart." Do not invent the score. |

Checkout speech starts when the remaining score is **170 or less**, not only under 160. Scores from 161 to 170 can still be finished, and 160 itself is treble 20, treble 20, double 20. The route comes from the checkout chart in this file. If the remaining score is 159, 162, 163, 165, 166, 168, or 169, say it cannot be finished and tell them to leave 40.

The last scoring dart of the leg must be in the **double ring** or the **inner bull**. The outer bull is 25 and is not a finish.

### How a visit is counted

1. The phone watches the board.
2. A new dart sticks. The app finds the **metal point**, not the flight. The point is the score.
3. The flight colour must match the player whose turn it is. Colour does not change the number of points.
4. The dart is provisional while it stays in the board.
5. After the third dart, or earlier if the leg is won or the visit busts, the app commits the visit and speaks.
6. If the player pulls the darts after only one or two scoring darts, those darts still count. A player may throw fewer than three.
7. A bust cancels the whole visit. The remaining score goes back to the start of the visit.
8. The next player in the colour order throws. In an 01 game, the first player starts leg 1 and every odd leg. The second player starts every even leg.

### Fouls the camera can call

- Bust, leaving 1, or finishing on a single. These come from the rules engine.
- A miss or a bounce: the player threw, and no new point is in the board. That dart is 0.
- A dart that was in the board and then falls out before the player clears the board. Remove it.
- A fourth dart in one visit. Ignore its score and say so.
- The wrong colour for this turn.
- A tip the camera cannot see, because another dart is in front of it. Ask the player to confirm or pull the front dart.

### What this camera cannot call

The phone is looking at the board, not at the throw line. It cannot see a foot over the oche. Do not pretend it can. The player can tap a foul if they want that recorded.

One camera will sometimes hide a dart behind another dart. The app must always have a way to correct a dart before the visit is trusted.

### How a point becomes a number

Straighten the board in the image so the bull is the centre and the 20 is at the top. Measure the point as a fraction of the distance from the bull to the outer edge of the double ring.

| Radius, as a fraction of the double's outer edge | Zone |
| --- | --- |
| under 0.037 | Inner bull, 50, and it is a double |
| under 0.094 | Outer bull, 25 |
| 0.585 to 0.632 | Treble ring |
| 0.953 to 1.000 | Double ring |
| between the outer bull and the treble | Inner single |
| between the treble and the double | Outer single |
| outside 1.000 | Miss, 0 |

If the point sits on the line between two zones, say "check this dart" instead of guessing.

The wedges, clockwise from the top, are 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5. Each wedge is 18 degrees. The 20 is centred on the top. The number is the wedge that contains the point.

### Phone setup

- The whole board, including the outer numbers, stays inside the picture.
- Put the phone about a metre away, a little to one side, on a stand. It must not move during the leg.
- A face-on view makes it hard to see how far the point is from the bull. A view from too far around the side flattens the board.
- Light the board evenly. Shadows and changing sunlight make the camera miss darts.

### Build order

1. **Game menu, rules, and voice, no camera.** Every game in the menu can be played by tapping the board. 501 is the first one to test: "score 100", busts, and the checkout chart. Then 301, 701, 1001, High Score, Average, and the group games.
2. **Camera lock.** The phone finds the board and keeps it framed.
3. **Dart point.** A new dart appears, the app reads the point, and the same rules engine scores it.
4. **Blue and red check.** Wrong colour is spoken. Turn order still decides whose visit it is.
5. **Correction.** The player can fix a dart the camera got wrong before the next visit starts.
6. **APK and iOS.** Package the Flutter app for both.

### Apps and code already in the world

Use these as research. Do not copy their code into this app.

| Name | What it is | What to take from it |
| --- | --- | --- |
| Autodarts Lens | Commercial phone-camera scorer for steel tip. | One phone can score a real game. It needs a stand, a side angle, and good light. One camera misses a dart hidden behind another. The player must be able to correct a score. |
| Scolia, Autodarts X | Commercial multi-camera boxes. | Several cameras see darts that one phone cannot. Not the first build. |
| DeepDarts | 2021 research project. One camera. On a fixed phone-style view it scored the visit correctly about 94.7% of the time. | The idea: find the dart point and four board points, then compute the score. It is Python, not a phone app. |
| Scored | Single-camera experiment. Finds the point and the flight, straightens the board, then uses radius and angle. | Same geometry as the table above. The repository has no license, so write our own code. |
| OpenDartboard | Open three-camera scorer on a Raspberry Pi. GPL-3. | Shows a home scorer is possible. It is not a phone app, and its license does not fit copying the code into this project. |

### First match the app must get right

Blue and red. 501. Best of 3 legs.

- Blue throws T20, S20, S20. The phone says "Score 100. Remaining 401."
- A visit that leaves 1 is a bust and the score returns.
- From 100 the phone says "Remaining 100. Treble 20, double 20. The last dart must be in the double ring."
- D20 from 40 wins. S20 from 40 is a bust.
- A red dart on Blue's turn is called out and is not subtracted.

## 3. The board, as the game sees it

Twenty numbered wedges. Clockwise from the top: **20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5**.

The point of the dart decides the score.

| Zone | Score |
| --- | --- |
| Outer single | face value |
| Inner single | face value |
| Double ring | 2 × the number |
| Treble ring | 3 × the number |
| Outer bull | 25. This is a single, not a double. |
| Inner bull | 50. This counts as double 25. |
| Miss, bounce-out, or outside the double ring | 0 |

Highest one dart: **T20 = 60**. Highest visit: **180**. Highest finish: **170** (T20, T20, Bull).

Notation: `T` treble, `D` double, `S` single, `25` outer bull, `Bull` inner bull.

## 4. A visit

- One player throws at most **three** darts. That is one visit.
- The visit ends early when the player wins the leg or busts.
- Darts thrown after a win do not count.
- A dart that misses or falls out scores 0 and is not thrown again.
- Players alternate visits unless a game section below says otherwise.
- A **leg** is one game from the start state to a winner.
- A **set** is an odd number of legs. A **match** is an odd number of legs, or an odd number of sets. First side to the majority wins. Do not play the remaining legs.
- Who starts: one dart each at the bull. Closer to the centre starts leg 1 and every later odd leg. The other player starts every even leg.

## 5. Gameplay index

| ID | Game | Players | How you win | Default |
| --- | --- | --- | --- | --- |
| X01-501 | 501 | 2+ | Reach exactly 0 on a double | Straight in, double out |
| X01-301 | 301 | 2+ | Same, from 301 | Straight in, double out |
| X01-701 | 701 | 2+ | Same, from 701 | Straight in, double out |
| X01-1001 | 1001 | 2+ | Same, from 1001 | Straight in, double out |
| CR-STD | Cricket | 2–4 | Close 15–20 and bull, level or ahead on points | Inner bull = 2 marks |
| CR-CUT | Cut Throat Cricket | 2–4 | Same closes; points are given to opponents; lowest score wins | |
| CR-NS | No Score Cricket | 2–4 | First to close all seven | No points |
| CR-TAC | Tactics | 2 | Cricket on 10–20 and the bull | Points on |
| CR-MM | Mickey Mouse | 2–8 | Close 20 down to 12, and the bull. No points | |
| SEQ-ATC | Around the Clock | 2+ | Hit 1 through 20 in order, then any bull | |
| SEQ-DAW | Doubles Around | 1+ | Hit D1 through D20 in order, then the inner bull | |
| SEQ-ACC | Accumulator | 2+ | Climb 1 to 20. A visit with no hit sends you back to 1 | |
| RND-SH | Shanghai | 2+ | Highest score after rounds 1–7, or an instant Shanghai | 7 rounds |
| RND-HI | Halve It | 2+ | Highest score. A missed round halves your score | 9 rounds listed below |
| RND-HS | High Score | 1+ | Highest total after 8 visits | Also called Count Up |
| RND-AVG | Average | 1+ | Highest 3-dart average after 10 visits | Average = total ÷ visits |
| RND-RACE | Race | 2+ | Highest total after the target round | Target 500. Also 300 or 1000 |
| RND-BOWL | Bowls | 2+ | First to 5 points, closest to 50 each round | Exact 50 scores 2 |
| RND-GF | Golf | 2+ | Fewest strokes over 9 holes | Best dart counts |
| RND-BB | Baseball | 2+ | Most runs over 9 innings | |
| EL-KILL | Killer | 3–8 | Last player with lives | 3 lives |
| EL-KO | Knockout | 3–8 | Last player with lives. Lowest visit each round loses a life | 3 lives |
| EL-LOS | Last One Standing | 3–8 | Last player with lives. A missed target round loses a life | 3 lives |
| EL-FTL | Follow the Leader | 3–8 | Last player with lives. Miss the leader's bed and lose a life | 3 lives |
| EL-21 | 21 | 2–8 | First to 5 points. Closest to 21 without going over | Exact 21 scores 2 |
| EL-100 | Nine-Dart Century | 1+ | Closest to 100 in 9 darts without going over | One round |
| EL-ELIM | Elimination | 2–8 | Reach 0. Landing on another score resets that player | Start at 301, open out |
| EL-SCRAM | Scram | 2, or 2 teams | Higher score after both sides have scored and blocked | 15–20 and bull |
| SEQ-DRAG | Chase the Dragon | 1+ | Hit T10 through T20 in order, then the inner bull | Trebles only |
| SEQ-9L | Nine Lives | 2+ | Finish 1–20 and the bull, or be the last with lives | 3 lives |
| SEQ-LAD | Ladder | 2+ | Reach the bull. A missed visit drops you one number | |
| SEQ-HARE | Hare and Hounds | 2+ | Hare completes the loop, or a hound lands on the hare's number | Hare starts on 20, hound on 5 |
| SEQ-BLK | Blackout | 1+ | Turn off all 20 numbers | A treble also turns off both neighbours |
| EL-BEAT | Beat It | 2–8 | Last player in. You must beat the visit before yours | 3 misses and you are out |
| EL-420 | 420 | 2–6 | Land on exactly 420 | 100, 200, 300, and 400 reset |
| RND-BER | Bermuda | 1+ | Highest total after 13 Halve It rounds | Missed round halves the score |
| EL-PRIS | Prisoner | 2+ | Finish the clockwise circuit, or hold every dart | Inner single and bull imprison a dart |
| EL-GOT | Gotcha | 2+ | Land exactly on 301 | Matching an opponent resets them to 0 |
| EL-FIVES | All Fives | 2+ | Reach exactly 51 | Only visit totals divisible by 5 score |
| PR-B27 | Bob’s 27 | 1+ | Finish the double ladder still above 0, with the highest score | Start at 27 |
| PR-121 | 121 | 1+ | Climb the checkout ladder | Fail and return to 121 |
| PR-JDC | JDC Challenge | 1 | Highest score over the 57-dart test | |
| PR-3BED | Three in a Bed | 1 | Single, double, and treble of one number in one visit | Number 20 |

## 6. X01 — 501 and the countdown games

X01 is the main game. Both sides start at the same total and subtract.

### 501

- Start at **501**.
- Straight in: the first dart inside the scoring area counts.
- Subtract the visit from the remaining score.
- The dart that hits **exactly 0** must be a double or the inner bull.
- The outer bull (25) cannot finish the leg.
- First to exactly 0 wins the leg.

301, 701, and 1001 use the same rules. Only the starting total changes. 301 is the short game. 701 and 1001 are the long games.

### Bust

The **whole visit** is cancelled, and the score returns to what it was before the visit, if the darts would:

- go below 0
- hit 0 without the last dart being a double or the inner bull
- leave **1**

Stop throwing when a bust happens. A score of 1 can never be finished, because the smallest double is 2.

| Remaining | Visit | Result |
| --- | --- | --- |
| 32 | D16 | Wins |
| 32 | T20 | Bust. Still on 32 |
| 40 | D10, D10 | Wins on the second dart |
| 20 | S20 | Hits 0 on a single. Bust. Still on 20 |
| 50 | Bull | Wins |
| 50 | 25, 25 | Hits 0, but the last dart is not a double. Bust |
| 3 | S1, S1 | Leaves 1. Bust. Still on 3 |
| 2 | D1 | Wins. Lowest checkout |

### Start and finish options

| Mode | Start | Winning dart |
| --- | --- | --- |
| Straight in, double out | Any scoring dart | Double or inner bull. **This is the default.** |
| Double in, double out | Points start only when a double or the inner bull is hit. That dart counts. Darts before it in the visit do not. | Double or inner bull |
| Master out | Any scoring dart | Double, treble, or inner bull |
| Open out | Any scoring dart | Any scoring dart that lands on exactly 0 |

Double in example: from 301, D20 on the first dart means the player is in and the 40 counts, so they are on 261. A visit with no double leaves them on 301.

### Finish setup

Leave an even number you can hit as a double. The useful leaves are **40 (D20)**, **32 (D16)**, **36 (D18)**, **24 (D12)**, and **16 (D8)**.

These seven scores cannot be finished in three darts: **159, 162, 163, 165, 166, 168, 169**. From one of them, score so the next visit starts on 40 or 32. From 169: T20, T20, S9 leaves 40.

A **nine-darter** is 501 won in nine darts, the minimum. One way: 180, 180, then 141 (T20, T19, D12).

Names used while scoring a visit:

| Score | Name |
| --- | --- |
| 100 or more | Ton |
| 180 | Maximum |
| The winning visit | Checkout |
| 170 checkout | Big fish |

## 7. Cricket

Marks, not a countdown. A single is 1 mark, a double is 2, a treble is 3. The outer bull is 1 mark. The inner bull is **2 marks**. Do not treat the inner bull as 3 marks unless the user asks.

### Standard Cricket

Also called American Cricket.

- Targets, in any order: **20, 19, 18, 17, 16, 15, bull**.
- Three marks close a target.
- After you close a target, more hits on it score points until every opponent has closed it. Then it is dead.
- Point values: the number itself, or 25 / 50 for the bull. A dart that both closes the number and has marks left over scores those extra marks.
- Example: 2 marks on 20, then T20. One mark closes it. The other two score 40, if the opponent is still open on 20.
- You win when every target is closed and your points are **greater than or equal to** every opponent.
- If you close first but you are behind on points, you have not won yet.

Numbers outside 15–20, other than the bull, do nothing.

### Cut Throat

Same targets and the same three marks. Points are added to **each opponent who has not closed** that target. You do not add them to yourself. When you have closed everything, the lowest score wins. A tie for the lowest score is a win.

### No Score Cricket

Same seven targets. Nobody scores points. First to close all seven wins. If both close in the same round, the side that threw first wins.

### Tactics

Standard Cricket, but the targets are **10 through 20 and the bull**.

### Mickey Mouse

Close **20 down through 12**, and the **bull**. Three marks each. No points. First to close the list wins.

## 8. Race games

### Around the Clock

Hit **1, then 2, then 3**, through **20**, then any bull. A single, double, or treble of the current number all count as one step. They do not skip ahead. One visit can move through several numbers. Misses do not send you back. First to hit the bull wins.

### Doubles Around

Same order, but only the double counts. After D20, the inner bull finishes it.

### Accumulator

Climb 1 through 20, any bed of the number. If a whole visit misses the current number, that player goes back to **1**. First to clear 20 wins. No bull.

## 9. Round games

Every player throws one visit at the same target. Then the target changes.

### Shanghai

- Default: 7 rounds, targets **1 through 7**. Long game: 1 through 20.
- Only the current number scores. Single, double, and treble use their normal values.
- **Shanghai:** single, double, and treble of that round’s number in one visit. That player wins at once.
- If nobody does that, the highest total wins.

### Halve It

Start at 0. Nine rounds, in order:

1. 20
2. 19
3. 18
4. 17
5. 16
6. 15
7. Any double (the inner bull counts)
8. Any treble
9. Bull, scored as 25 or 50

Darts on the target add their score. Anything else adds 0. If the visit scores nothing, halve the running total and round down. Highest total wins.

### High Score

Also called Count Up. Any number of players, or teams with one shared total.

- Everyone starts at 0.
- Default **8** visits each. Every dart scores its normal value, including 25 and 50.
- Nothing busts. There is no double finish.
- Highest total wins.
- A tie is broken by the best single visit. If that is also tied, play one extra visit.

The phone says the visit, then the running total. "Score 100. Total 480."

### Average

Same scoring as High Score. The length is **10** visits, so the total divided by 10 is the 3-dart average.

- Average = total points ÷ visits completed.
- A total of 600 after 10 visits is an average of 60.
- Highest average wins. With the same number of visits, that is the same winner as the highest total.
- The screen leads with the average. The phone says "Average 60" at the end, and during play it says the visit and the average so far.

### Race

Count up toward a target. The menu offers **300**, **500**, and **1000**. Default **500**.

- Every dart scores. Going past the target is allowed.
- When one player reaches the target, the others still throw that round, so everyone has had the same number of visits.
- Then the highest total wins. Reaching the target first does not win by itself if someone else finishes the round higher.
- This is not 1001. 1001 counts down and must finish on a double.

### Bowls

- Each round, every player throws 3 darts at no fixed number. Add the visit.
- The target total is **50**.
- Closest to 50 wins the round and scores 1 point. Distance is absolute, so 45 and 55 are equal.
- A visit of exactly 50 scores 2 points.
- A tie for closest gives each of those players 1 point.
- First to **5** points wins.

### Golf

Nine holes, on numbers 1 through 9. Three darts per hole. Only the **best** dart counts.

| Best dart | Strokes |
| --- | --- |
| Double | 1 |
| Treble | 2 |
| Single | 3 |
| All three miss | 5 |

Lowest total wins. Par is 27. An 18-hole game repeats 1–9, or uses 1–18. Par is then 54.

### Baseball

Nine innings, on numbers 1 through 9. Only that number scores. Single = 1 run, double = 2, treble = 3. All three darts can score. Most runs wins. A tie plays extra innings on the bull: outer bull 1 run, inner bull 2, until the scores differ.

## 10. Elimination games

### Killer

Three or more players.

1. Each player claims a different number from 1 to 20 with one dart. If it is taken or it misses, throw again.
2. Each player has **3 lives** and is not a killer yet.
3. Hit the double of your own number once. You become a killer. That hit does not cost a life.
4. A killer who hits the double of another player’s number takes one life from them.
5. A killer who hits their own double loses one life.
6. A player who is not a killer cannot take lives.
7. At 0 lives that player is out and their number is dead.
8. Last player with lives wins.

### Gotcha

Count up from 0 toward **301**. Check the total after every dart. If your total equals another player’s total, that player goes back to **0**. Going over 301 cancels the whole visit. First to land on exactly 301 wins.

### All Fives

After a visit, if the three-dart total divides by 5, add that total divided by 5. A total of 60 scores 12. A total of 26 scores 0. First to exactly **51** wins. Going past 51 cancels that visit. You may stop before the third dart if the total is already the winning one.

### Knockout

Three or more players. Each starts with **3** lives.

- Every round, each player who is still in throws one visit of up to 3 darts. Every dart scores its normal value.
- The lowest visit loses a life.
- If several players tie for the lowest score, only those players throw one more visit. The lowest of that throw-off loses a life. Repeat if they tie again.
- At 0 lives the player is out and skips the later rounds.
- Last player with lives wins.

### Last One Standing

Three or more players. Each starts with **3** lives. Everyone aims at the same target for the round.

The targets repeat in this order: **20, 19, 18, 17, 16, 15, any double, bull**.

- Any single, double, or treble of the number counts. The inner bull counts as a double on the "any double" round. The bull round accepts 25 or 50.
- Hit the target at least once in the visit and you keep your lives.
- Miss with all three darts and you lose a life.
- Last player with lives wins.

### Follow the Leader

Three or more players. Each starts with **3** lives.

- The leader throws one dart. The exact bed it lands in is the target. Treble 20 means treble 20, not the single.
- A miss on the setting dart is thrown again. The leader does not lose a life for setting the target.
- Every other player then throws up to 3 darts at that bed.
- Hit it and you stay in. Miss all three and you lose a life.
- The next player who still has lives becomes the leader and sets a new bed.
- Last player with lives wins.

### 21

Two or more players. A round is one visit each.

- Add the normal score. A player may stop before the third dart.
- Going over **21** scores nothing for that round.
- The closest total to 21, without going over, scores 1 point.
- A total of exactly 21 scores 2 points.
- If two players share the closest total, and neither has 21, each scores 1 point.
- First to **5** points wins.

### Nine-Dart Century

Each player throws **9** darts, three visits, and adds them up.

- The aim is to get as close to **100** as possible without going over.
- Going over 100 scores 0 for that player.
- The closest player wins the round.
- Default is one round. A tie is broken by one extra visit: closest to 20 without going over.

### Elimination

Everyone starts at **301**. Subtract each dart's score. This game is open out: any scoring dart can hit 0.

- After each dart, if your remaining score is exactly the same as another player's remaining score, that player goes back to **301**.
- Going below 0 cancels the whole visit.
- The first player to reach exactly 0 wins.
- A player who has already won is not reset.

### Scram

Two players, or two teams. One side **scores**. The other **blocks**. Then they swap.

- The targets are 15, 16, 17, 18, 19, 20, and the bull.
- Players alternate visits.
- The blocker closes a target with 3 marks. A single is 1, a double is 2, a treble is 3. The outer bull is 1 mark. The inner bull is 2 marks.
- The scorer adds points only on targets the blocker has not closed. A closed target scores 0. Points are the normal dart values, so a treble 20 on an open 20 scores 60.
- The half ends when every target is closed, or after the scorer has had **8** visits, whichever comes first. Both sides must have had the same number of visits.
- Swap roles. The higher scoring total wins.

### Chase the Dragon

Hit the trebles in order: **T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20**, then the **inner bull**. A single or a double of the current number does not count. First to hit the inner bull wins.

### Nine Lives

Around the Clock with lives. Hit 1 through 20 in order, then any bull. Each player starts with **3** lives.

- A visit that hits the current number can move through several numbers, one per dart.
- A visit that misses the current number with all three darts loses a life.
- At 0 lives that player is out.
- First to finish the bull wins. If every other player is out, the last player wins even if they have not reached the bull.

### Ladder

Climb **1** through **20**, then the bull. Any bed of the current number moves you up one step, and one visit can move several steps.

- A visit with no hit on the current number moves you **down one** number. You cannot go below 1.
- First to hit the bull wins.
- This is not Accumulator. Accumulator sends you back to 1. Ladder drops you one.

### Hare and Hounds

One hare and one or more hounds. Movement is clockwise around the board: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, and back to 20.

- The hare starts on **20**. The hound starts on **5**.
- Any bed of your next clockwise number moves you onto it.
- The hare wins by going all the way around and hitting **20** again.
- A hound wins by landing on the number the hare is currently on.
- Fox Hunt is the same game on doubles only, with the hare two numbers ahead. Use it only if named.

### Blackout

All 20 numbers start lit. Players may hit them in any order.

- A single or a double turns that number off.
- A treble turns that number off and also turns off the number on each side of it on the board. Treble 20 also turns off 5 and 1.
- A number that is already off stays off. The bull does nothing.
- First player to turn off all 20 numbers wins.

### Beat It

Two or more players. The first visit of the game only sets a score.

- Every later visit must score **more** than the visit just before it. An equal score fails.
- A failed visit gives that player one miss. The score to beat stays the previous successful visit.
- **3** misses and that player is out.
- Last player still in wins.
- Sudden Death is this game with 1 miss instead of 3.

### 420

Count up from 0. Every dart scores.

- Landing on **exactly 420** wins.
- A visit that would go over 420 is cancelled.
- Landing exactly on **100, 200, 300, or 400** sends the player back to the hundred below: 100 back to 0, 200 back to 100, 300 back to 200, 400 back to 300.

### Bermuda

Halve It with 13 rounds, in this order:

1. 12
2. 13
3. 14
4. Any double, including the inner bull
5. 15
6. 16
7. 17
8. Any treble
9. 18
10. 19
11. 20
12. Outer bull, 25
13. Inner bull, 50

Start at 0. Hits add their score. A visit that scores nothing halves the total, rounding down. Highest total wins.

### Prisoner

Best with a group. Everyone needs their own darts. The target order is clockwise, starting at **1**, so the next number is **18**, then **4**, and so on back to **20**.

- The playable area of a number is the outer single, the double, and the treble.
- Hit the playable area of your current number and you advance.
- A dart in the inner single, or in either bull, stays in the board. It is a prisoner. It does not advance you.
- One hit in the playable area of that number captures one prisoner there. A bull captures one prisoner in the bull.
- The capturer then throws with one extra dart. The owner throws with one fewer. Visits are still taken three darts at a time until the extras are used.
- A dart that misses the board is out for one visit, then comes back.
- First player to complete every number wins. A player who holds every dart in the game also wins.
- The camera has to leave prisoner darts in the picture and not score them as the next player's visit.
- In the app, Prisoner is the clockwise race only. A single, double, or treble of the current number advances, the bull does not, and darts are not captured. The tap board cannot tell an inner single from an outer single.

## 11. Practice games

### Bob’s 27

Start on **27**. Rounds are D1, D2, … D20, then the inner bull. Each dart in the double adds that double’s value. The bull adds 50. If all three darts miss, subtract that double’s value (50 on the bull). Reaching 0 or below is out. Otherwise the highest score at the end wins.

### 121

Start on **121**, double out. Three darts to check it out. Success moves the target up by 1. Failure sends you back to 121. Stop at a target the player chooses, or at 170.

### JDC Challenge

57 darts.

| Section | Darts | Score |
| --- | --- | --- |
| Numbers 10 through 15, three darts each | 18 | Only that number, at its normal value |
| One dart at D1 through D20, then one dart at the bull | 21 | A hit scores the double, or 50. A miss scores 0 |
| Numbers 15 through 20, three darts each | 18 | Same as the first section |

There is no instant-win Shanghai in this test. Highest total wins.

### Three in a Bed

Hit the single, the double, and the treble of one number in a single visit. Default number is 20, which scores 120. Count how many visits it takes.

## 12. More than two players

- Each player has their own flight colour. The order of colours is the throwing order.
- Free-for-all: each player has their own score and throws in that order.
- Pairs or teams: one shared score. Write the order before the game. Each player throws a full visit, then the turn passes to the other side.
- The same bust, close, and win rules apply to the shared score.
- No handicap unless the user sets one. A handicap is either a lower start total, or the stronger side skipping one or more opening visits.

## 13. Checkout chart, 170 to 2

Double out. This is the usual route, not the only route. `Bull` is the inner bull.

Impossible in three darts: **169, 168, 166, 165, 163, 162, 159**.

### 170–151

| Score | Route |
| --- | --- |
| 170 | T20 T20 Bull |
| 167 | T20 T19 Bull |
| 164 | T20 T18 Bull |
| 161 | T20 T17 Bull |
| 160 | T20 T20 D20 |
| 158 | T20 T20 D19 |
| 157 | T20 T19 D20 |
| 156 | T20 T20 D18 |
| 155 | T20 T19 D19 |
| 154 | T20 T18 D20 |
| 153 | T20 T19 D18 |
| 152 | T20 T20 D16 |
| 151 | T20 T17 D20 |

### 150–131

| Score | Route |
| --- | --- |
| 150 | T20 T18 D18 |
| 149 | T20 T19 D16 |
| 148 | T20 T16 D20 |
| 147 | T20 T17 D18 |
| 146 | T20 T18 D16 |
| 145 | T20 T15 D20 |
| 144 | T20 T20 D12 |
| 143 | T20 T17 D16 |
| 142 | T20 T14 D20 |
| 141 | T20 T19 D12 |
| 140 | T20 T20 D10 |
| 139 | T20 T13 D20 |
| 138 | T20 T18 D12 |
| 137 | T20 T19 D10 |
| 136 | T20 T20 D8 |
| 135 | T20 T17 D12 |
| 134 | T20 T14 D16 |
| 133 | T20 T19 D8 |
| 132 | T20 T16 D12 |
| 131 | T20 T13 D16 |

### 130–101

| Score | Route |
| --- | --- |
| 130 | T20 T18 D8 |
| 129 | T19 T16 D12 |
| 128 | T18 T14 D16 |
| 127 | T20 T17 D8 |
| 126 | T19 T19 D6 |
| 125 | 25 T20 D20 |
| 124 | T20 T16 D8 |
| 123 | T19 T16 D9 |
| 122 | T20 T10 D16 |
| 121 | T20 T11 D14 |
| 120 | T20 S20 D20 |
| 119 | T19 T10 D16 |
| 118 | T20 S18 D20 |
| 117 | T20 S17 D20 |
| 116 | T20 S16 D20 |
| 115 | T20 S15 D20 |
| 114 | T20 S14 D20 |
| 113 | T20 S13 D20 |
| 112 | T20 S12 D20 |
| 111 | T20 S11 D20 |
| 110 | T20 Bull |
| 109 | T20 S9 D20 |
| 108 | T20 S8 D20 |
| 107 | T19 Bull |
| 106 | T20 S6 D20 |
| 105 | T20 S5 D20 |
| 104 | T18 Bull |
| 103 | T19 S6 D20 |
| 102 | T20 S10 D16 |
| 101 | T17 Bull |

110, 107, 104, and 101 in this band are two-dart finishes. The others need three, except where a two-dart route exists and is shown.

### 100–50

| Score | Route |
| --- | --- |
| 100 | T20 D20 |
| 99 | T19 S10 D16 |
| 98 | T20 D19 |
| 97 | T19 D20 |
| 96 | T20 D18 |
| 95 | T19 D19 |
| 94 | T18 D20 |
| 93 | T19 D18 |
| 92 | T20 D16 |
| 91 | T17 D20 |
| 90 | T18 D18 |
| 89 | T19 D16 |
| 88 | T16 D20 |
| 87 | T17 D18 |
| 86 | T18 D16 |
| 85 | T15 D20 |
| 84 | T20 D12 |
| 83 | T17 D16 |
| 82 | T14 D20 |
| 81 | T19 D12 |
| 80 | T20 D10 |
| 79 | T13 D20 |
| 78 | T18 D12 |
| 77 | T19 D10 |
| 76 | T20 D8 |
| 75 | T17 D12 |
| 74 | T14 D16 |
| 73 | T19 D8 |
| 72 | T16 D12 |
| 71 | T13 D16 |
| 70 | T18 D8 |
| 69 | T19 D6 |
| 68 | T20 D4 |
| 67 | T17 D8 |
| 66 | T10 D18 |
| 65 | T19 D4 |
| 64 | T16 D8 |
| 63 | T13 D12 |
| 62 | T10 D16 |
| 61 | T15 D8 |
| 60 | S20 D20 |
| 59 | S19 D20 |
| 58 | S18 D20 |
| 57 | S17 D20 |
| 56 | S16 D20 |
| 55 | S15 D20 |
| 54 | S14 D20 |
| 53 | S13 D20 |
| 52 | S12 D20 |
| 51 | S11 D20 |
| 50 | Bull |

99 needs three darts. T19 leaves 42, and 42 is not a double.

### 40–2

| Score | Route |
| --- | --- |
| 40 | D20 |
| 39 | S7 D16 |
| 38 | D19 |
| 37 | S5 D16 |
| 36 | D18 |
| 35 | S3 D16 |
| 34 | D17 |
| 33 | S1 D16 |
| 32 | D16 |
| 31 | S15 D8 |
| 30 | D15 |
| 29 | S13 D8 |
| 28 | D14 |
| 27 | S11 D8 |
| 26 | D13 |
| 25 | S9 D8 |
| 24 | D12 |
| 23 | S7 D8 |
| 22 | D11 |
| 21 | S5 D8 |
| 20 | D10 |
| 19 | S3 D8 |
| 18 | D9 |
| 17 | S1 D8 |
| 16 | D8 |
| 15 | S7 D4 |
| 14 | D7 |
| 13 | S5 D4 |
| 12 | D6 |
| 11 | S3 D4 |
| 10 | D5 |
| 9 | S1 D4 |
| 8 | D4 |
| 7 | S3 D2 |
| 6 | D3 |
| 5 | S1 D2 |
| 4 | D2 |
| 3 | S1 D1 |
| 2 | D1 |
| 1 | Impossible |

## 14. What the game should remember

For a 501 leg:

`three-dart average = (points scored ÷ darts thrown) × 3`

Count only darts that were thrown. A 12-dart 501 leg is an average of 125.25.

For Cricket, marks per round = `(marks ÷ darts thrown) × 3`.

Store, per leg: remaining score or marks, darts thrown, visit scores, checkout, winner, and who started. The app keeps visits, finished games, achievements, and leaderboards in local storage on the phone. Achievements unlock in the background and do not stop play.

## 15. Rule switches

| Switch | Default |
| --- | --- |
| Start total | 501 |
| In rule | Straight in |
| Out rule | Double out |
| Legs in a match | Best of 3 |
| Sets | Off |
| Cricket scoring | Points on |
| Inner bull in Cricket | 2 marks |
| Cricket numbers | 15–20 and bull |
| Around the Clock | Finish on any bull |
| Killer lives | 3 |
| How you become a killer | One double of your own number |
| Golf | 9 holes, best dart counts |
| Shanghai | Rounds 1–7 |
| Halve It | Round down |

## 16. Glossary

| Term | Meaning |
| --- | --- |
| Bust | The visit does not count. The score goes back. |
| Checkout | The visit that wins a countdown leg, and the darts used to do it. |
| Dead | A Cricket number that every player has closed. It scores nothing. |
| Double out | The winning dart is a double or the inner bull. |
| Leg | One game, from the start state to a winner. |
| Mark | One hit toward closing a Cricket number. Three marks close it. |
| Maximum | 180. |
| Set | A group of legs. |
| Straight in | The first scoring dart counts. No double is required to start. |
| Ton | A visit of 100 or more. |
| Visit | Up to three darts by one player. |

## 17. Change log

| Date | Change |
| --- | --- |
| 2026-10-26 | First handbook, including setup and tournament rules. |
| 2026-10-26 | Cut to game rules only, after the user said the project is the dart game and not the surrounding regulations. |
| 2026-10-26 | Added the camera-app plan: 501, blue and red darts, spoken visit totals, checkout speech from 170 down, and the build order. |
| 2026-10-26 | Added the game menu: 301, 701, 1001, High Score, Average, Race, and the group games Knockout, Last One Standing, Follow the Leader, 21, Nine-Dart Century, Elimination, Scram, and Bowls. |
| 2026-10-26 | Removed Football, Tic-Tac-Toe, and English Cricket. This project keeps dart games only. Subgames of 01, Cricket, Around the board, and the adding-up games are separate choices because each one plays differently. |
| 2026-10-26 | Added the playable web app in `app/`. Camera is a live view. Scoring is by tapping the bed. Local storage keeps visits, leaderboards, and achievements. App Prisoner is the clockwise race, without capturing darts. |
