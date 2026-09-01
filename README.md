# Wetter – Prototyp

Eine kleine Wetter-App fürs Handy und den Desktop. Eine einzige Datei,
kein Build, kein Server, kein API-Schlüssel.

## Anschauen

**`index.html` herunterladen und doppelklicken.** Das war's.

Ins Handy bekommst du sie am einfachsten so:

1. Datei irgendwo hochladen, wo sie über eine Adresse erreichbar ist
   (Netlify Drop, GitHub Pages, eigener Webspace).
2. Seite auf dem Handy öffnen → *Zum Startbildschirm hinzufügen*.
   Dann sieht sie aus und startet wie eine echte App.

> Kleiner Hinweis: Beim direkten Doppelklick (`file://`) blocken manche
> Browser die Standortabfrage. Dann einfach oben rechts über die Lupe
> den Ort suchen – der wird gespeichert und beim nächsten Mal
> automatisch geladen.

## Was drin ist

| Bereich | Inhalt |
|---|---|
| **Jetzt** | Temperatur, gefühlt, Regenwahrscheinlichkeit, Wind, Luftfeuchte, UV |
| **Die nächsten Stunden** | 24 Stunden ab jetzt zum Wischen – Temperatur, Regenbalken, dazu eine Kurzfassung wie „Regen ab 10 Uhr" |
| **Für heute** | Alltagstipps im Klartext – Schirm, Sonnencreme, Eiskratzer, Zwiebellook … |
| **7 Tage** | Wochenübersicht mit Regenzeitfenster je Tag, aufklappbar für Details |
| **Sonne & Mond** | Auf- und Untergang, Tageslänge, Sonnenbogen, Mondphase, nächster Vollmond |
| **Radar** | Animiertes Niederschlagsradar, auf den Ort und 50 km drumherum ausgerichtet |

Die Hintergrundfarbe wechselt mit der Tageszeit am gewählten Ort:
Nacht, Morgendämmerung, Tag, Abendrot.

## Woher die Daten kommen

| Quelle | Wofür | Schlüssel nötig? |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) mit **ICON** (DWD) | Vorhersage, Sonnenzeiten | nein |
| Open-Meteo Standardmodell | UV-Index (ICON liefert keinen) | nein |
| [RainViewer](https://www.rainviewer.com/api.html) | Radarbilder | nein |
| [Esri Dark Gray Canvas](https://server.arcgisonline.com) | Kartenhintergrund | nein |
| [BigDataCloud](https://www.bigdatacloud.com) | Ortsname zur GPS-Position | nein |
| [Leaflet](https://leafletjs.com) | Kartendarstellung | – |

Mondauf- und -untergang sowie die Mondphase rechnet die App selbst im
Browser aus (Algorithmus von SunCalc). Dafür gibt es keine gute freie API,
und so funktioniert es für jeden Ort und jede Zeitzone.

## Zwei Dinge, über die man leicht stolpert

**Warum ICON und nicht das Standardmodell.** Open-Meteos `best_match`
hat für Essen an einem Testtag um 15 Uhr *78 %* Regenwahrscheinlichkeit
gemeldet – ICON-D2 vom Deutschen Wetterdienst für denselben Ort und
dieselbe Stunde *10 %*. In Mitteleuropa ist ICON die verlässlichere
Quelle (2 km Auflösung für die ersten 48 h), deshalb nutzt die App es
dort. Außerhalb Europas fällt sie automatisch auf `best_match` zurück –
siehe `modelFor()`.

**Warum die Tageswerte selbst berechnet werden.** Open-Meteo bildet den
Tages-Wettercode aus allen 24 Stunden und nimmt davon den schlimmsten.
Fallen um 3 Uhr nachts 0,2 mm, steht für den ganzen Tag „Nieselregen" –
auch wenn es von morgens bis abends trocken und sonnig bleibt. Genau
daran ist die erste Version gescheitert (ein Sonntag mit durchgehend
2–4 % Regenrisiko wurde als Regentag angezeigt).

`daySummary()` schaut deshalb nur auf 7–21 Uhr und lässt Niederschlag
den Tag erst benennen, wenn er ihn auch prägt: mindestens drei nasse
Stunden, oder zwei mit über 60 % – Gewitter und kräftiger Regen zählen
immer. Sonst entscheidet die mittlere Bewölkung. Das Zeitfenster
(„Regen 10–15 Uhr") steht trotzdem daneben, denn *wann* es regnet ist
meist nützlicher als *ob*.

## Die Tipps anpassen

Alle Sprüche stehen in einer einzigen Funktion – `buildTips()`, etwa in
der Mitte der Datei. Eine Regel sieht so aus:

```js
if (uv >= 6)
  add('🧴','Heute besser eincremen',
      'UV-Index ' + Math.round(uv) + ' – Sonnencreme und eine Sonnenbrille sind Pflicht.',
      'warn', 2);
//     ^Emoji  ^Überschrift          ^Nachsatz                    ^Farbe  ^Priorität
```

`level` steuert nur die Farbe (`alert` rot, `warn` orange, `good` grün,
leer = neutral), `prio` die Reihenfolge – kleinere Zahl steht weiter oben.
Angezeigt werden die vier wichtigsten Tipps für heute, drei je Folgetag.

Neue Regel dazuschreiben: einfach eine weitere `add(...)`-Zeile einfügen.
Verfügbare Werte pro Tag: `max`, `min`, `feels`, `pop` (Regen­wahr­schein­lich­keit
in %), `mm` (Niederschlag), `snow`, `uv`, `wind`, `gust`, `kind`
(`clear`, `rain`, `snow`, `thunder`, `fog` …) und `d.rainWindows`
(die Regenzeitfenster, z. B. `[{from:10, to:15}]`).

## Fallstricke beim Weiterbauen

- **RainViewer liefert nur bis Zoomstufe 7 echte Radarbilder** (mit
  512-px-Kacheln), darüber kommt eine graue Platzhalter-Kachel mit
  „Zoom Level Not Supported". Deshalb steht `maxNativeZoom: 8` am
  Radar-Layer – Leaflet skaliert dann weich hoch, statt Platzhalter zu
  laden. Nicht hochsetzen.
- **ICON kennt keinen UV-Index.** Der kommt aus einem zweiten,
  kleinen Aufruf ohne Modellvorgabe. Schlägt der fehl, läuft die App
  ohne UV weiter – dann fehlen nur die Sonnencreme-Tipps.
- **Kartenkacheln:** CARTO verlangt inzwischen einen API-Key, und
  OpenStreetMap blockt Apps, die direkt von deren Servern laden
  (403 „App is not following the tile usage policy"). Deshalb Esri
  Dark Gray Canvas – das ist keyfrei und stabil.
- **Zeitzonen:** Open-Meteo liefert Zeiten als Ortszeit *ohne*
  Zeitzonen-Kennung (`2026-09-01T06:32`). Nie mit `new Date()` parsen –
  entweder direkt als Text verwenden oder über `state.tzOffset` in UTC
  umrechnen. Die Mondzeiten rechnen intern komplett in UTC und werden
  erst beim Anzeigen in die Ortszeit formatiert.

## Nächste Ausbaustufen

- Mehrere gespeicherte Orte zum Durchwischen
- Push-Nachricht am Morgen mit dem Tipp des Tages (braucht dann doch einen kleinen Server)
- Als PWA mit Offline-Cache, damit die letzten Daten auch ohne Netz da sind
