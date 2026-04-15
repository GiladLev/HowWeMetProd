# LIVE Games Integration Checklist

Run every scenario with two browser sessions (UserA/UserB) connected to the same match.

## Race And Sync Scenarios

- Start game at the same time from both sessions and verify both see the same active phase.
- Perform simultaneous input submissions and verify no player payload is overwritten.
- Verify both sessions move to `choosing` together with the same `winnerId`.
- Verify winner choice advances both sessions to the same next game.

## Reconnect Scenarios

- Disconnect UserA mid-game, keep UserB playing, reconnect UserA, verify state catches up.
- Refresh UserB during active round, verify restored state continues from remote state.
- Refresh both users during `choosing`, verify option lock and current game remain consistent.

## Game Coverage (1-10)

- Game01: tie reset and replay sync correctly on both clients.
- Game02: simultaneous correct answers pick the faster timestamp consistently.
- Game03: bomb holder and explosion result are identical on both clients.
- Game04: wrong/wrong reset syncs and both can replay same round.
- Game05: round/lives/matches survive refresh and stay aligned.
- Game06: answer reveal and winner sync identically.
- Game07: taps update live during countdown on both clients.
- Game08: picker/guesser roles are identical on both clients.
- Game09: wheel spin starter and winner are identical on both clients.
- Game10: shared countdown starts on both clients; final scores resolve to same winner.
