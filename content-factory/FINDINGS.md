# Findings — Option 1: Echter TTS + Timing-Check

**Datum:** 2026-07-21 · **Ziel:** Prinzip #2 („Audio ist die zeitliche Source of Truth") auf echten Daten de-risken.

## Was getestet wurde

Reale TTS-Generierung der Hidden-Rush-Demo-VO über Higgsfield `generate_audio`
(Modell `seed_audio` / ByteDance Seed Audio 1.0, Voice „Cillian", preset).

- **Kosten-Preflight** (`get_cost:true`, submittet nichts): **4,8 Credits** für das volle 75s-Skript (~700 Zeichen). Balance: 4541 Credits (Ultra) → vernachlässigbar, weit unter dem Hidden-Rush-Budget ($8/Video).
- **Generierung:** Job `c32b6871…`, `completed`. Ausgabe: **WAV, 24 kHz, 45,96 s** + Waveform-JSON.

## Ergebnis (entscheidend)

**`seed_audio` liefert KEINE Wort- oder Satz-Zeitmarken** — nur Audio, Dauer und eine
Amplituden-Waveform. Damit ist bewiesen:

> Reale TTS (seed_audio) ⇒ **Forced Alignment ist zwingend**, um die kanonische Timeline
> aus dem echten Audio zu bauen. Eine Timeline aus geschätzter Sprechzeit ist ausgeschlossen (Prinzip #2).

Cross-Check: echte Dauer **45,96 s** ≈ Mock **45,36 s** → die WPM-Annahme des Mock-Pfads war realistisch.

Egress-Hinweis: Der Media-Host (CloudFront) ist in dieser Session durch die Egress-Policy
blockiert (403). Download **und** Forced Alignment gehören ohnehin in den Worker (erlaubter
Egress + ffmpeg + Aligner) — nicht in die interaktive Agent-Session.

## Was daraus in Code wurde

- `src/providers/tts/higgsfield.ts` — realer Adapter mit dem beobachteten Contract; `provides_word_timing = false`, Transport injizierbar (Worker-HTTP-Client / `HIGGSFIELD_API_KEY`).
- `src/providers/alignment/route.ts` — `selectAlignmentStrategy()`/`alignAuto()`: Marks vorhanden → `provider_marks`, sonst → `forced_alignment`. Ist Forced Alignment `not_configured`, schlägt es **laut** fehl (kein falscher Erfolg).
- Registry-Update: `higgsfield-seed-audio` = `configurable` (keine Marks), `forced-alignment` = **PFLICHT** für seed_audio.
- `fixtures/real-audio/generation.json` — Provenienz des realen Laufs.

## Nächster konkreter Schritt: Forced-Alignment-Worker

Empfohlene Umsetzung (`ForcedAlignmentProvider` implementieren):

1. **Audio-Decode ohne ffmpeg-Zwang:** 24 kHz PCM-WAV via Python `wave` → numpy float32
   (umgeht ffmpeg für reines WAV). ffmpeg nur für nicht-WAV-Quellen.
2. **Aligner:** `faster-whisper` (CTranslate2, CPU-tauglich, kein Torch) mit
   `word_timestamps=True` → Wortgrenzen + Konfidenz; Modell `base`/`small`.
   Alternativen: WhisperX (genauer, braucht Torch) oder `aeneas` (braucht espeak+ffmpeg).
3. **Normalisierung** der Whisper-Wörter gegen das Skript (Segment-IDs zuordnen,
   Konfidenz je Wort/Segment speichern) → `Alignment`-Schema.
4. Danach greift der bestehende Pfad unverändert: `buildTimeline` → SRT/VTT → QC.

Damit läuft der volle Loop **Skript → echtes Audio → Forced Alignment → Timeline → Untertitel**
auf realen Daten.
