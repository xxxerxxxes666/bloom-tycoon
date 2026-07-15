**Xerxes Addendum — Performance, Flowers, Tutorial, Meaningful Progress**

This addendum is authoritative for all future audits and implementation passes.

- Preserve the newly approved format: Xerxes loves the current board-first visual direction. Improve it rather than reverting it.
- Product mandate: simple, Diablo-II-style, user-friendly, and exceptionally compulsive through tactile matching, clear goals, fast rewards, visible mastery, and irresistible next-order momentum—not through clutter, confusion, casino pressure, or predatory monetization.
- Performance budget: active play should target smooth 60fps on a normal modern phone. Reduce the current baseline of roughly 1,031 DOM nodes, 55 hidden preview nodes, 249 box-shadow layers, 227 filtered elements, 10 idle animations, and 106 images. Remove future-preview DOM from runtime, cap simultaneous particles/animations, reduce filter/drop-shadow stacking, avoid animating large filtered containers, and respect `prefers-reduced-motion`. Network load is already fast; rendering/compositing is the present lag risk.
- Flower-art mandate: future tile art must move closer to the original reference’s imagery—compact hand-painted relic/floral objects, strong simple silhouettes, restrained jewel colors, directional candlelit highlights, dark oxidized edges, slightly imperfect nostalgic raster texture, and convincing integration into carved sockets. Avoid clean vector-flat geometry, neon gradients, plastic mobile-game gloss, overly perfect symmetry, and generic AI fantasy icon polish. Use original assets only; borrow material principles, never protected Diablo expression.
- Tutorial mandate: build a short, skippable, replayable tutorial using direct manipulation and spotlighting rather than paragraphs. Teach: swap adjacent flowers; match 3 to fill the bouquet; match 4 to create Black Candle Vine; match beside Cursed Thorn to crack it; finish before moves expire; earn coins and restore the greenhouse. The first lesson must begin within 3 seconds, never block a confident player for more than one tap, and offer a Help/Replay Tutorial entry outside active board clutter.
- Progress-bar rule: every visible bar must predict a concrete reward or decision. Keep one bouquet progress indicator and one Greenhouse restoration/level bar. The Greenhouse bar must show the next visible unlock/restoration and fill from completed bouquet rewards. Apothecary/MANA and Faction/BLOOD bars must remain hidden until each has a distinct, understandable gameplay unlock; otherwise remove them from the player-facing product. Remove duplicate restored-greenhouse, ceremony XP, and ladder bars.
- No micro-pass may claim success for changing only tutorial text, a bar label, a hint, or an animation. These requirements must be delivered as cohesive, browser-verified milestones.

**Current Verdict**

Bloom Tycoon now has a real playable core: original gothic tile assets, an 8x8 board, guided first swaps, cascade feedback, bouquet completion, greenhouse restoration, Next Order, Round 2 Cursed Thorn teaching, and Round 3/Bloodroot payoff logic. What still feels prototype-like is the product frame around that core: too many hidden-but-present preview systems, audit-era controls, text ledgers, reward rails, and competing “systems UI” surfaces keep fighting the board’s authority. The reference image reads like one disciplined game screen; the current build reads like a strong game buried inside a long-lived verifier prototype.

**Principles**

Diablo-style hierarchy/materiality to borrow:
- One altar-board as the visual center, with carved sockets, low text density, heavy framing, aged metal/stone, candlelit contrast, and restrained gold/violet/blood accents.
- Side rail as atmosphere plus status, not a dashboard.
- Bottom strip as inventory flavor, not a second menu.
- Rare effects should feel ritualistic and expensive.

Casual match-3 clarity/pacing to borrow:
- Immediate goal/moves clarity, one obvious next action, fast control return, readable tile silhouettes, satisfying cascades, and clear reward-to-restoration loop.
- Royal Match/Gardenscapes convention: match levels feed visible room/garden/castle restoration with simple one-tap progression and compact rewards, not exposed ledgers.
- Candy Crush convention: limited moves, fixed goals, blockers, cascades, and special matches are easy to parse before they are deep.

**Top 10 Problems**

1. `path-ledger-drawer` plus 50+ round preview nodes are product poison even when collapsed. The DOM at [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:7429) tells future runs to keep extending roadmap UI instead of polishing the core loop.

2. Review/prototype controls still exist in the primary controls row: `Complete Bouquet`, `Shape Bloom`, four boosters, Sacrifice, Shuffle at [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:7507). Round 1 hides many, but they remain first-class architecture and keep leaking into later states.

3. The screen has too many status layers: objective, `firstSwapCue`, `ritualLog`, greenhouse dial, active orders, restoration ladder, ceremony, bottom inventory, chest, Flowerpedia, Chapter Progress. The player should not need to parse five narrators.

4. The mobile layout is a workaround stack, not a designed mobile interface. It hides desktop rail/bottom at [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:6955), compresses objective chips at [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:6976), then adds `mobileGreenhousePlinth` under the board at [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:7187). It fits, but it is visually less authoritative.

5. The board is strong but over-effected. `.board`, `.tile`, particles, rings, veins, sigils, motes, refill channels, and target flights all stack around [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:2031). Feedback risks becoming glitter-noise instead of legible cause/effect.

6. The left rail is visually right but structurally noisy. `Greenhouse`, `Apothecary`, `Faction`, `Active Orders`, `Black Market` all exist at [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:7346), but the current heartbeat only needs Greenhouse + Active Orders during the first minute.

7. `roundOneRestoration` is doing too many jobs: Round 1 restore, Round 2 upgrade, Round 3 finale, bouquet trophy, greenhouse scene, ledger, XP preview, buttons. See [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:7559). It should be one ceremony pattern with one dominant action.

8. Text is still too explanatory. Completion and failure copy around [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:15967) explains preservation, rewards, storage, Flowerpedia, chapters, streaks. Casual players need “Bouquet complete -> +coins -> Restore.”

9. Palette is close but muddy. The UI overuses near-black, brown, violet, blood, moss, and gold simultaneously. The reference works because dark mass is disciplined and highlight colors have hierarchy.

10. Recent history shows tiny visual/verifier commits accumulating around the same surfaces. `git log` shows repeated “compact”, “keep above fold”, “cascade juice”, “legible payoff” commits. That is a symptom: future work needs milestone passes, not more small copy/layout patches.

**Simplification**

CUT: future-round preview DOM, visible/debug review controls in player flow, Flowerpedia/Chapter Progress during active play, long ceremony copy, repeated reward-choice copy, bottom explanatory lore during Round 1.

HIDE: boosters, Sacrifice, Chest, Path/Ledger, Black Market, faction/apothecary meters until after the player has completed the first restoration.

COLLAPSE: left rail to Greenhouse art + Active Orders + coins only in Round 1/Round 2; bottom Elements to icons/counts only after Round 1.

KEEP: board, title stack, objective/moves, active orders, original tile art, Cursed Thorn blocker, Black Candle Vine, greenhouse before/after, Next Order.

STRENGTHEN: tile silhouettes, board socket contrast, one primary button, bouquet completion burst, greenhouse restoration before/after, mobile first viewport.

**Visual System**

Palette: black `#050404`, charcoal `#0b0807`, iron line `#30251d`, aged gold `#b9874d`, bright reward gold `#d7b16d`, blood `#9b1d22`, violet only for magic `#692d86`, moss only for restoration `#5f8338`.

Contrast: board/tile icons must beat panel ornaments; text secondary color should be 55-65% contrast, primary objective 85%+, reward 100%.

Type: title serif 48-64 desktop, 28-32 mobile; objective 16-18 desktop, 12-13 mobile; panel labels 10-12 uppercase; no paragraph copy in active play.

Frames/sockets: one outer game frame, one board frame, one side rail frame. Stop nesting card-inside-card visuals.

Tile scale: desktop board 620-650px; mobile board 366-378px, 3px gaps, icon fills 84-90%, socket detail reduced behind icons.

HUD spacing: objective within 8px of title, board within 8-12px of objective/cue, controls within 8px of board.

Panel limits: active play max 2 side cards, max 1 bottom strip, max 2 non-tile buttons.

Animation: swap 180-220ms, clear hit 400-550ms, cascade settle under 900ms, bouquet complete 1200-1600ms, greenhouse restore 1800-2400ms. Supreme Bloom rare only.

Mobile: no left rail; use a top compact HUD and one board-first frame. Greenhouse restoration should become a full-screen ceremony after completion, not a persistent plinth under active play.

**Messy Elements**

Messy/redundant: `pathLedgerDrawer`, `bouquetPath`, `greenhouseOrderLadder`, `flowerpediaLedger`, `chapterProgress`, `roundCeremony`, `ritualLog`, reward choice panels.

Too dark: side cards, modal panels, some tile wells when particle effects are absent.

Too ornate: button corner diamonds, repeated decorative borders, board particles competing with tile icons.

Too text-heavy: booster status, failed retry preservation copy, ceremony rewards, Flowerpedia/Chapter text.

Too prototype-like: `demoCompleteBtn`, `shapeBloomBtn`, huge audit-marker arrays, Round 4-57 preview renderer scaffolding.

**Roadmap**

Pass 1: Board-First Stripback and HUD Authority.
Files/areas: [playable/midnight_bloom_prototype.html](/opt/data/bloom-tycoon-live/playable/midnight_bloom_prototype.html:6215), controls, Path/Ledger, bottom strip, Round 1/2 active CSS.
Acceptance: active Round 1 and focused Round 2 show board, objective/moves, one cue, max two buttons, Greenhouse/Active Orders only on desktop, no Path/Ledger/Chest/Flowerpedia/Chapter/debug controls, mobile shows at least 8 rows at 390x844 with no scroll needed for core play.

Pass 2: Payoff Ceremony Unification.
Files/areas: `roundOneRestoration`, `advanceGreenhouseUpgrade`, `renderBouquetTrophy`, `renderRoundCeremony`.
Acceptance: bouquet completion hides board, shows one bouquet trophy + one greenhouse before/after + one action. Round 1 restore, Round 2 upgrade, Round 3 conservatory use the same ceremony pattern with different art/copy. No reward ledger paragraphs.

Pass 3: Visual Polish and Feedback Discipline.
Files/areas: board/tile CSS, particle queues, Cursed Thorn classes, objective target flights.
Acceptance: tiles are brighter and more legible than sockets; cascades have one readable hit event per wave; Cursed Thorn damage is unmistakable; Supreme Bloom remains rare; no overlapping labels; desktop/mobile screenshots read as one dark framed game screen.

**Stop List**

Do not add rounds, currencies, factions, ledgers, boosters, storage systems, lore panels, collection systems, chapter progress, preview surfaces, monetization, accounts, analytics, ads, SDKs, backends, trackers, debug buttons, or tiny copy-only commits. No Round 58 work until Pass 1 is done.

**Security/IP Guardrails**

Use original repo-local assets only. Do not copy Diablo fonts, frames, icons, monsters, UI ornaments, or branded expression. The target is material hierarchy, not protected art. No secrets, `.env`, tokens, trackers, accounts, backend services, payment hooks, or broad permissions.

**Foreman Prompt**

“Read `docs/hermes_audit_next_tasks.md`, but prioritize the superseding board-first mandate. Implement one visible milestone only: simplify and beautify active Round 1/Round 2 toward a Diablo-style framed match-3 screen. Board is hero. Hide Path/Ledger, future previews, Flowerpedia, Chapter, Chest, boosters, Sacrifice, debug/review controls, and paragraph copy during active play. Preserve match engine, saves, 64 tiles, Cursed Thorn, bouquet completion, greenhouse restoration, Next Order, no broken images, no console errors, no mobile overflow. Do not add features or rounds.”

Sources inspected: local `AGENTS.md`, Hermes/tasks, UI direction, game brief, current HTML/CSS/JS, recent git history, attached reference image, live GitHub Pages URL `https://xxxerxxxes666.github.io/bloom-tycoon/playable/midnight_bloom_prototype.html`, plus public references for Royal Match, Gardenscapes, and Candy Crush conventions from Apple/Google/Playrix/Wikipedia search results.