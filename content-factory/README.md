# Kordix Content Factory

Automatisierte, faceless **YouTube-Content-Maschine** — multi-niche, multi-channel.
Erstes reales Channel Profile: **Hidden Rush** (englischsprachige Psychologie-Marke).

> **Kernprinzip:** *Audio ist die zeitliche Source of Truth.* Die finale Timeline und
> alle Untertitel werden aus dem **realen Voiceover** abgeleitet — nie aus geschätzter
> Wortzahl oder Sprechgeschwindigkeit.

Dieser Ordner ist ein **self-contained, extraktionsfertiger Workspace**. Er lebt heute
im OS-Repo und wird später per `git subtree split` in ein eigenes Repo
(`kordix-content-factory`) ausgelagert, das sich als Marketing-/Content-Datenquelle ans
Kordix Company OS andockt.

## Zwei Ebenen

- **Ebene 1 — Build (diese Codebasis):** die Produktions-Software.
- **Ebene 2 — Produktion (`WORKSTREAM.md`):** Nischenwahl → Scoring/Verdict → ein Production
  Package pro Video. CLI: `npm run decide`.

## Status (MVP-Slice)

✅ Vertikaler Slice lauffähig & getestet: **Profile → Brief → Skript → (Mock-)TTS →
echtes Alignment → Timeline → Untertitel → QC → Production Package.**
✅ Ebene 2: Nischen-Scoring (13 Dimensionen, Kill/Pivot/Scale) + `runProduction()` je Video.
Kein bezahltes Generieren, kein Netzwerk, deterministisch.

## Quickstart

```bash
cd content-factory
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest — 26 Tests
npm run slice       # erzeugt videos/hr-demo-spotlight/ + druckt Capability-Matrix
```

## Was der Slice erzeugt

```
videos/hr-demo-spotlight/
  manifest.json                 # verknüpft Artefakte per Version/Status
  brief.json
  research/{claims,sources}.json
  script/voiceover.segments.json
  audio/voiceover.wav           # reales WAV (gitignored)
  audio/alignment.{words,segments}.json
  storyboard/timeline.json      # kanonische Timeline (ganzzahlige ms)
  captions/subtitles.{srt,vtt}  # aus demselben Alignment
  qc/media-qc.json              # Timing- & Konfidenz-QC
  renders/RENDER_PLAN.md        # Render braucht ffmpeg/Remotion-Worker
```

## Struktur

```
src/
  schemas/     Zod-Verträge (channel, brief, script, alignment, timeline, manifest)
  audio/       pure-TS WAV-Reader (ffprobe-Ersatz im Mock/Local-Pfad)
  providers/   Interfaces + Capability Registry + Mock-Adapter (TTS, Alignment)
  timeline/    scene-split, build-timeline, qc
  subtitles/   SRT/VTT aus Alignment
  state/       Job-State-Machine + Freigabe-Gates + stabiles Hashing
  cost/        Kostenschätzung / Budget-Gate
  channels/    Profile-Loader
  pipeline/    demo-Slice + run-slice (Orchestrierung)
channels/
  hidden-rush/ profile.json + style-bible.md
  quiet-history/ profile.json   (2. Profil → beweist Kanaltrennung)
```

## Nächste Ausbaustufen

Siehe `ARCHITECTURE.md` → Roadmap. Kurz: echter TTS (Higgsfield) + Wort-Timing-Prüfung
→ Forced-Alignment-Fallback (Python-Worker) → Remotion/FFmpeg-Render-Worker →
Assets (Higgsfield/Canva) mit Style Anchors → Dashboard-Integration ins OS →
Upload/Analytics (YouTube API).
