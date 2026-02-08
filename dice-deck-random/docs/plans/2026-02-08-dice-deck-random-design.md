# Dice Deck Random - Game Design Document

## Overview
1vs1 card game with dice mechanics. NPC battle (priority-based AI). Mobile-first (portrait 9:16).

## Game Rules

### Basic
- 1vs1, Player HP: 20
- Deck: 20 cards (max 2 copies of same card)
- Starting hand: 4 cards, draw 2 per turn
- Deck out: can't draw (game continues)
- No hand limit

### Turn Structure
1. Dice Roll (6-sided)
2. Draw 2 cards
3. Main Phase (summon & attack in any order)
4. End Turn

### Cards
- Stats: Name, HP, ATK, Summon Dice (multiple), Attack Dice (multiple)
- Some cards have effects (summon/destruction/passive/auto-trigger)
- Cost-balanced: total cost 18 points

### Cost System (Total: 18)
| Parameter | Cost |
|---|---|
| HP | 1pt per 1 |
| ATK | 1pt per 1 |
| Summon Dice | 1.5pt per number |
| Attack Dice | 1.5pt per number |
| Effect | 3-6pt based on strength |

### Field Layout
```
      [Opponent HP]
       [O1][O2]          <- Opponent back (2 slots)
     [O3][O4][O5]        <- Opponent front (3 slots)
     ─────────────
     [P1][P2][P3]        <- Player front (3 slots)
       [P4][P5]          <- Player back (2 slots)
      [Player HP]
```

### Protection
- A card with both forward 2 slots occupied cannot be attacked
- P4 protected by P1 + P2
- P5 protected by P2 + P3
- Player protected by P4 + P5
- If entire front row (3 slots) filled -> back row protected -> player protected

### Battle
- Attack enabled: dice match OR carried over from previous turn
- Attack-ready state persists until used
- Battle: both cards deal their ATK as damage to each other
- HP 0 -> card destroyed (sent to trash)
- Player ATK = 0 (takes damage but deals none back)
- Target: any unprotected enemy card or player

### Effects (18 types)

**Summon Effects:**
1. Deal 1 damage to random enemy card
2. Draw 1 card
3. Adjacent ally ATK+1 (permanent)
4. Deal 2 damage to enemy with lowest HP
5. Add 1 attack dice number to adjacent ally

**Destruction Effects:**
6. Draw 1 card
7. Deal 2 damage to the card that destroyed this
8. Deal 1 damage to all enemy cards
9. Return random card from trash to hand
10. Adjacent allies HP+2

**Passive Effects:**
11. Adjacent allies ATK+1
12. Self damage taken -1 (min 1)
13. Start of own turn: self heal 1 HP
14. On attack: draw 1 card
15. Adjacent enemy cards ATK-1 (min 0)

**Auto-trigger (opponent turn, no player choice):**
16. When opponent summons: deal 1 damage to summoned card
17. When adjacent ally destroyed: self ATK+1 (permanent)
18. When attacked: deal 1 extra damage back

## Card Pool
- ~30 unique cards
- Abstract/simple visual style (colors + icons)
- Cost-balanced at 18 points each
- Mix of no-effect (pure stats) and effect cards

## UI Layout (Portrait 9:16)
```
┌─────────────────────┐
│  Opponent Hand: ████ │
├─────────────────────┤
│     [Opponent HP20]  │
│      [O1][O2]        │
│        [O3][O4][O5]  │
│ 🎲4 ───────── [END]  │
│    [P1][P2][P3]      │
│      [P4][P5]        │
│     [Player HP20]    │
├─────────────────────┤
│ [Card1][Card2][Card3]│
│       [Card4]        │
└─────────────────────┘
```

- Dice display: left center of field
- End Turn button: right center of field (away from hand to prevent misclick)

## Controls
- **Drag & Drop**: drag card to target
- **Tap-to-Tap**: tap card (select) -> tap target (execute)
  - Summon: tap hand card -> tap empty field slot
  - Attack: tap attack-ready card -> tap enemy card/player
  - Deselect: tap empty area or same card again
- Attack-ready cards: glowing effect
- Summonable cards: glowing in hand

## Screen Flow
```
[Title Screen]
  ├-> [Deck Editor]
  │    └-> Select 20 cards from pool (max 2 copies)
  │    └-> Save/Load deck
  ├-> [NPC Battle]
  │    └-> [Battle Screen]
  │         └-> [Result Screen (win/lose)]
  │              └-> Back to Title
  └-> [Rules] (simple text)
```

## NPC AI (Priority-based)
1. Attack player if possible (random selection if multiple)
2. Attack enemy card that can be killed (random if multiple)
3. Attack with best trade efficiency (ATK dealt vs damage received)
4. Summon to front row (3 slots) first
5. Summon to back row (2 slots)
6. End turn if nothing possible

NPC deck: randomly built from card pool (respects 2-copy rule)

## Technical
- Godot 4.6 / GL Compatibility
- Screen: 9:16 portrait (1080x1920)
- Scene structure:
  - Main.tscn - scene management
  - TitleScreen.tscn - title screen
  - DeckEditor.tscn - deck editor
  - Battle.tscn - battle screen
  - Result.tscn - result screen
- Card data: GDScript Resource / JSON
- Input: Godot input events for drag & tap
- Future online: game logic structured for server separation
