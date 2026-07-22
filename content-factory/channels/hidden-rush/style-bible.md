# Hidden Rush — Visual Style Bible

> Faceless, intelligent, mysterious, emotionally controlled, documentary. Schwerpunkt Psychologie.
> **Visual Preset: `cinematic_editorial`** (nicht Stickman — Stickman ist ein separates, günstiges Preset für andere Kanäle).

## Look — Cinematic Editorial (2.5D)
- **Ansatz:** hochwertige, malerische 2.5D-Editorial-Frames, semi-realistische Texturen, Hero-Frame-first.
- **Palette:** Navy `#070B1E` / Surface `#0E1430` / Cyan `#38E5FF` / Periwinkle `#7B81FF`.
- **Hintergründe:** cineastische Navy-Umgebungen, volumetrisches Licht, feiner Film-Grain, geringe Schärfentiefe.
- **Typografie:** klare geometrische Sans, sparsam; **nie** Text/Logo/UI ins generative Bild einbacken — deterministisch im Renderer.

## Charakter
- `HR-FIGURE` — „The Observer": semi-realistische, **feste** Identität über alle Szenen, gedämpft-zeitgenössisch, gesichtslos (abgewandt/verdeckt — Brand-Regel). Seed 424242 für Konsistenz.

## Szenen-Templates (Preset cinematic_editorial)
| Erzählfunktion | Template |
|---|---|
| hook | `premium_i2v` (Hero-Moment) |
| setup | `still_parallax` |
| tension | `two_character_interaction` |
| turn | `premium_i2v` |
| payoff | `object_closeup` |
| cta | `editor_typography` |
| transition | `still_parallax` |

## Negative Vorgaben (immer)
`watermark, extra limbs, unreadable text, brand logos, distorted faces, flat clip-art, cartoon stickman`

## Bewegung & Audio
- Standard: hochwertige Stills + langsame Kamerafahrt/Parallax. **I2V selektiv** an Hook/Turn (Kosten-Gate G5).
- Format: **24 fps** (Hidden-Rush-Bible), 16:9 — kommt ausschließlich aus dem Channel Profile / Video Manifest.
- Musik: Ambient-Tension-Bett unter -22 LUFS; Riser nur an Turns. Mix-Ziel Video: ~ -14 LUFS integrated, True Peak ≤ -1 dBTP.

## Style Anchors
Vor jedem Batch zuerst **3 Style Anchors** erzeugen und via **G4** freigeben (Charakterkonsistenz), erst dann restliche Assets.
