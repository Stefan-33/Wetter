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
| **Für heute** | Alltagstipps im Klartext – Schirm, Sonnencreme, Eiskratzer, Zwiebellook … |
| **7 Tage** | Wochenübersicht, jeder Tag aufklappbar mit Details und eigenen Tipps |
| **Sonne & Mond** | Auf- und Untergang, Tageslänge, Sonnenbogen, Mondphase, nächster Vollmond |
| **Radar** | Animiertes Niederschlagsradar, letzte ~2 Stunden plus Kurzvorhersage |

Die Hintergrundfarbe wechselt mit der Tageszeit am gewählten Ort:
Nacht, Morgendämmerung, Tag, Abendrot.

## Woher die Daten kommen

| Quelle | Wofür | Schlüssel nötig? |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Vorhersage, Sonnenzeiten, UV | nein |
| [RainViewer](https://www.rainviewer.com/api.html) | Radarbilder | nein |
| [Esri Dark Gray Canvas](https://server.arcgisonline.com) | Kartenhintergrund | nein |
| [BigDataCloud](https://www.bigdatacloud.com) | Ortsname zur GPS-Position | nein |
| [Leaflet](https://leafletjs.com) | Kartendarstellung | – |

Mondauf- und -untergang sowie die Mondphase rechnet die App selbst im
Browser aus (Algorithmus von SunCalc). Dafür gibt es keine gute freie API,
und so funktioniert es für jeden Ort und jede Zeitzone.

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
(`clear`, `rain`, `snow`, `thunder`, `fog` …).

## Nächste Ausbaustufen

- Stundenverlauf für heute und morgen
- Mehrere gespeicherte Orte zum Durchwischen
- Push-Nachricht am Morgen mit dem Tipp des Tages (braucht dann doch einen kleinen Server)
- Als PWA mit Offline-Cache, damit die letzten Daten auch ohne Netz da sind
