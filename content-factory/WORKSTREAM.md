# Ebene 2 — YouTube Production Workstream

> Ergänzt die technische Content Factory (Ebene 1, „Software bauen") um die **operative**
> Ebene: *von der Nischenwahl bis zum fertigen Video.* (Aus Stefans Review, P1.1/P1.2.)

## Zwei Ebenen, klar getrennt

| Ebene | Frage | Artefakt |
|------|-------|----------|
| 1 · Build | Wie baut der Agent die Produktions-Software? | Master-Prompt + `content-factory/` Code |
| 2 · Produktion | Welche Nische, und wie entsteht wiederholbar ein Video? | **dieses Workstream** |

## Teil A — Nischenwahl & Validierung

`Interview → Scoring (13 Dimensionen, gewichtet) → Ranking → Entscheidung` mit expliziten
Kill/Pivot/Scale-Kriterien und einem Test-Plan für die ersten 10 Videos.

- **Interview** (`src/niche/interview.ts`): strukturierte Fragen (Skills, Interessen, Constraints,
  Monetarisierung, Kandidaten) — als Daten, damit Dashboard/LLM sie fahren. Nutzt das OS-Muster
  (`/write-spec`, **PROJ-9 Demand Validation**) statt Neubau.
- **Scoring** (`src/niche/scoring.ts`): 13 begründete Dimensionen (1–5, **Begründung Pflicht** →
  keine erfundenen Kennzahlen), gewichtet → Score 1–5.
- **Verdict** (`scale | test | pivot | kill`): objektive Schwellen (`DEFAULT_DECISION_CRITERIA`)
  + **Hard-Kill** (kritische Dimension < 2 → sofort kill, egal wie hoch der Score).
- **Entscheidung** (`src/niche/decide.ts`): Ranking → Gewinner → Test-Plan (10 Videos) →
  Kill/Pivot/Scale-Regeln → `channel_profile_seed` (Brücke zum Channel-System).

```bash
npm run decide   # fährt die Entscheidung auf dem Demo-Datensatz (Stefan / Kordix)
```

Beispielausgabe (Demo): Hidden Rush **3.75 (test)** ≈ GMP **3.74 (test)** > AI Productivity
**3.02 (pivot)** — ein echtes Kopf-an-Kopf (Reichweite vs. Autorität/Monetarisierung).

## Teil B — Ein Production Package pro Video

`runProduction({ channel, brief, script })` (`src/pipeline/run-slice.ts`) ist der wiederverwendbare
Einstieg: Profile → Brief → Skript → TTS → echtes Alignment → Timeline → Untertitel → QC →
ein kontrolliertes Production Package unter `videos/<video_id>/`. Provider injizierbar
(Default sichere Mocks; echt: Higgsfield + Worker-Alignment). Der Demo-Slice (`runSlice`) ist
nur ein Spezialfall davon.

## Was bewusst noch fehlt (nächste Schritte)

- Reale Recherche/Demand-Signale in die Scorecard einspeisen (Firecrawl / PROJ-9-Anbindung) —
  heute sind die Scores begründete Experteneinschätzungen, keine Live-Metriken.
- LLM-gestützte Brief-/Skript-Erzeugung pro Test-Plan-Eintrag (statt Demo-Skript).
- Analytics-Rückkopplung, die Kill/Pivot/Scale automatisch anhand echter YouTube-Zahlen auswertet.
