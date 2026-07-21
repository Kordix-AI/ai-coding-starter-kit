# Architektur — Kordix Content Factory

## Entscheidungen (ADR-kompakt)

1. **Eigenes Repo, heute als Workspace.** Zielarchitektur = separates Repo, das sich ans
   Company OS andockt (Owner-Entscheidung Phase 0). Bis das Repo existiert, lebt der Code
   als entkoppelter `content-factory/`-Workspace mit **eigenem** `package.json` → Auslagern
   ist ein mechanischer `git subtree split`, kein Umbau.
2. **Audio = zeitliche Source of Truth** (nicht verhandelbar). Plan-Timestamps im Skript sind
   `timestamps_are_provisional: true`. Die finale Timeline entsteht aus dem realen Audio:
   reale Dauer (ffprobe/WAV-Header) + Wortgrenzen (TTS-Marks **oder** Forced Alignment).
3. **Provider-Unabhängigkeit über Adapter.** 11 Rollen als Interfaces
   (`src/providers/interfaces.ts`); Implementierungen austauschbar. Capability Registry
   markiert jede Rolle ehrlich als `available | configurable | not_configured`.
4. **Strukturierte Artefakte** (Zod-validiert), nicht ein Riesen-Prompt. Übergaben laufen über
   Schemas.
5. **Human-in-the-loop, technisch erzwungen.** `JobStateMachine.assertGate()` blockiert
   kostenpflichtige/riskante Stufen (`assets`→G5, `render`→G6, `publish`→G7), bis das Gate
   freigegeben ist.
6. **Reproduzierbarkeit.** Ganzzahlige Millisekunden, stabiles Hashing, injizierbare Uhr
   (`runSlice({ now })`) → deterministische Tests; Provenienz-Schema an jedem Ergebnis.
7. **Keine falschen Erfolgszustände.** Fehlgeschlagene Stufen → `failed` mit Grund;
   Render/Publish/Analytics sind ehrlich `configurable`/`not_configured`, nicht fingiert.

## Timing-Engine (Herzstück)

`Skript(segments)` → `MockTTSProvider.synthesize()` schreibt reales WAV + Provider-Marks →
`readWavDurationMs()` liest **echte** Dauer → `ProviderMarksAlignmentProvider.align()` baut
`Alignment` (Wort-/Segmentgrenzen + Konfidenz) → `buildTimeline()` erzeugt lückenlose,
überlappungsfreie Szenen (Szene 1 @ 0 ms, letzte Szene endet = Audio-Dauer) →
`buildCues()`/`toSrt()`/`toVtt()` aus **demselben** Alignment → `qcTimeline()` erzwingt die
Akzeptanzkriterien (Start, Lücken, Clip-Länge, Endzeit-Drift ≤ 1 Frame, Konfidenz-Schwelle).

## Connector-/Provider-Matrix (Ist-Zustand)

| Rolle | Status | Adapter / Hinweis |
|-------|--------|-------------------|
| research | ✅ available | Firecrawl (MCP) |
| llm | ✅ available | Claude `@anthropic-ai/sdk` |
| tts | ✅ available | MVP: `mock-tts`; echt: Higgsfield `generate_audio`/`create_voice` (Wort-Timing prüfen) |
| alignment | ✅ available | `provider-marks` (nutzt TTS-Marks) |
| alignment (fallback) | 🔴 not_configured | Forced Alignment (WhisperX/aeneas, Python-Worker) |
| image | ✅ available | Higgsfield `generate_image` (Kosten-Gate) |
| video (I2V) | ✅ available | Higgsfield `generate_video`, selektiv (Kosten-Gate) |
| thumbnail | ✅ available | Canva (MCP) |
| render | 🟡 configurable | Remotion + FFmpeg/ffprobe — **Worker nötig, ffmpeg hier nicht installiert** |
| storage | ✅ available | Supabase Storage (Media/Metadaten) |
| publish | 🔴 not_configured | YouTube Data API (OAuth) — Blueprint Phase 3 |
| analytics | 🔴 not_configured | YouTube Analytics API — Blueprint Phase 4 |

Quelle im Code: `src/providers/registry.ts` (`renderCapabilityMatrix()` beim Slice-Lauf).

## Storage-Strategie

Große Binärdateien (`*.wav`, Assets, `*.mp4`) gehören **nicht** ins Git (`.gitignore`).
Versioniert werden nur Metadaten/Artefakte (`*.json/md/srt/vtt`). Media später in Supabase
Storage; das Repo hält nur sichere Referenzen (Pfad/Hash/Status im `manifest.json`).

## Freigabe-Gates

`G0` Profile/Bible · `G1` Thema/Versprechen/Research · `G2` Skript/Claims · `G3` Voiceover/Timing
· `G4` 3 Style Anchors/Konsistenz · `G5` Storyboard/Kostenplan · `G6` Preview/QC · `G7`
Titel/Thumbnail/Metadaten/Publish. Jede Freigabe bindet an eine Artefaktversion und verfällt
bei inhaltlich relevanten Änderungen.

## Bewusst später (nicht im MVP)

Echter TTS-Lauf + Wort-Timing-Verifikation · Forced-Alignment-Worker · Remotion/FFmpeg-Render
· Asset-Generierung mit Style Anchors · 8–12-min-Format · Batch · Shorts-Ableitung · Upload
· Analytics-Lernschleife · Dashboard-Integration ins Company OS.

## Tests

`npm test` (Vitest): Schemas/Kanaltrennung, WAV-Roundtrip, Timeline-Akzeptanzkriterien
(+ Negativfälle), Untertitel, State-Machine/Gates/Retry/Resume, Kosten/Budget,
deterministischer Integrationstest (Skript→Audio→Alignment→Timeline→SRT).
