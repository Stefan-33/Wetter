# Wetter

Eine kleine Wetter-App fürs Handy und den Desktop. Installierbar wie eine
richtige App, ohne App-Store, ohne Konto, ohne API-Schlüssel.

## Als App aufs Handy

Die App braucht eine Adresse im Netz, damit sie sich installieren lässt.
Das ist kostenlos und in fünf Minuten erledigt:

1. **Hochladen** – den Ordner auf [Netlify Drop](https://app.netlify.com/drop)
   ziehen (kein Konto nötig für den ersten Wurf) oder in den
   Repository-Einstellungen GitHub Pages einschalten.
2. **Am Handy öffnen** und im Browsermenü *Zum Startbildschirm hinzufügen*
   wählen.
3. Fertig. Die App liegt mit eigenem Symbol auf dem Startbildschirm,
   startet im Vollbild ohne Browserleiste und funktioniert auch ohne Netz –
   dann mit dem zuletzt geladenen Stand und einem Hinweis dazu.

> **Ohne Hochladen:** `index.html` doppelklicken funktioniert auch, dann
> aber ohne Installation und ohne Offline-Betrieb. Manche Browser blocken
> dabei die Standortabfrage – einfach oben rechts über die Lupe den Ort
> suchen, der wird gespeichert.

## Was drin ist

| Bereich | Inhalt |
|---|---|
| **Jetzt** | Temperatur, gefühlt, Regenwahrscheinlichkeit, Wind, Luftfeuchte, UV |
| **Die nächsten Stunden** | 24 Stunden ab jetzt zum Wischen, mit Regenbalken und einer Kurzfassung wie „Regen ab 10 Uhr" |
| **Für heute** | Alltagstipps im Klartext – Schirm, Sonnencreme, Eiskratzer, Zwiebellook … |
| **7 Tage** | Wochenübersicht mit Regenzeitfenster je Tag, aufklappbar für Details |
| **Sonne & Mond** | Auf- und Untergang, Tageslänge, Sonnenbogen, Mondphase, nächster Vollmond |
| **Radar** | Rückblick zwei Stunden **und Vorhersage sechs Stunden**, auf den Ort und 50 km drumherum |

## Woher die Daten kommen

| Quelle | Wofür | Schlüssel nötig? |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Vorhersage aus sieben Modellen, Sonnenzeiten, UV, Vorhersageradar | nein |
| [RainViewer](https://www.rainviewer.com/api.html) | gemessene Radarbilder der letzten zwei Stunden | nein |
| [Esri Dark Gray Canvas](https://server.arcgisonline.com) | Kartenhintergrund | nein |
| [BigDataCloud](https://www.bigdatacloud.com) | Ortsname zur GPS-Position | nein |
| [Leaflet](https://leafletjs.com) | Kartendarstellung | – |

Mondauf- und -untergang sowie die Mondphase rechnet die App selbst im
Browser aus (Algorithmus von SunCalc). Dafür gibt es keine gute freie API,
und so funktioniert es für jeden Ort und jede Zeitzone.

---

## Die drei Entscheidungen, die den Unterschied machen

### 1. Sieben Modelle statt einem

Jedes Wettermodell rechnet anders und liegt mal richtig, mal daneben. Die
App holt deshalb sieben – ICON (DWD), EZMW, KNMI, DMI, Met Office,
Météo-France und GFS – und bildet daraus den Median. Ausreißer fallen so
von selbst heraus.

Zwei Stolperfallen stecken darin, beide nachgemessen:

**Nicht alle Stimmen sind unabhängig.** Bei der Regenwahrscheinlichkeit
melden EZMW, KNMI und DMI zu **100 %** identische Werte – sie bekommen sie
von Open-Meteo aus derselben Quelle. Bei der Temperatur stimmen dieselben
Modelle nur zu 9 % überein. Drei gleiche Werte sind aber eine Meinung, nicht
drei; sonst überstimmt eine einzige Quelle alle anderen. `ohneDubletten()`
filtert sie daher heraus – **nur** bei der Wahrscheinlichkeit, denn bei
Mengen und Temperaturen sind gleiche Werte echte Übereinstimmung.

**Verwandte Modelle zählen halb.** KNMI und DMI rechnen beide mit
HARMONIE-AROME und stimmen beim Niederschlag zu 93 % überein. In
`MODELLE_EU` steht darum hinter jedem Modell ein Stimmgewicht.

Die Regenwahrscheinlichkeit entsteht aus zwei Blickwinkeln: was die Modelle
selbst melden (Median, ohne Dubletten) und wie viel Stimmgewicht überhaupt
mit spürbarem Regen rechnet. Wo die Modelle weit auseinanderliegen, merkt
sich die App das als `konfidenz` – die Vorhersage ist dann eben unsicher.

### 2. Tageswerte aus den Tagstunden

Open-Meteo bildet den Tages-Wettercode aus allen 24 Stunden und nimmt davon
den schlimmsten. Fallen um 3 Uhr nachts 0,2 mm, steht für den ganzen Tag
„Nieselregen" – auch wenn es von morgens bis abends trocken und sonnig
bleibt. Genau daran ist die erste Fassung gescheitert.

`daySummary()` schaut deshalb nur auf 7–21 Uhr und lässt Niederschlag den
Tag erst benennen, wenn er ihn auch prägt: mindestens drei nasse Stunden,
oder zwei mit über 60 %. Gewitter und kräftiger Regen zählen immer. Sonst
entscheidet die mittlere Bewölkung.

Das Zeitfenster („Regen 10–15 Uhr") steht trotzdem daneben – denn *wann*
es regnet ist meist nützlicher als *ob*.

### 3. Radar, das nach vorn schaut

RainViewer gibt im freien Zugang **keine Vorhersagebilder** mehr heraus
(`radar.nowcast` kommt leer). Ein Radar, das nur die Vergangenheit zeigt,
beantwortet aber nicht die eine Frage, die man hat: *kommt da was?*

Die App rechnet die Vorhersage darum selbst: ein Raster von rund 180
Punkten um den Ort, jeder mit eigener Niederschlagsvorhersage im
Viertelstundentakt, sechs Stunden weit. Daraus wird ein Bild, das weich
hochskaliert über der Karte liegt.

Gröber als echtes Radar – die Rasterpunkte liegen etwa 10 km auseinander,
feine Schauerstrukturen gehen darin unter. Aber es zeigt, wo Regengebiete
durchziehen und wann sie da sind. Die Zeitleiste startet immer bei *jetzt*,
und die Balken darunter zeigen, wann es wie stark regnet.

## Die Tipps anpassen

Alle Sprüche stehen in einer einzigen Funktion – `buildTips()`. Eine Regel
sieht so aus:

```js
if (uv >= 6)
  add('🧴','Heute besser eincremen',
      'UV-Index ' + Math.round(uv) + ' – Sonnencreme und eine Sonnenbrille sind Pflicht.',
      'warn', 2);
//     ^Emoji  ^Überschrift          ^Nachsatz                    ^Farbe  ^Priorität
```

`level` steuert die Farbe (`alert` rot, `warn` orange, `good` grün, leer =
neutral), `prio` die Reihenfolge – kleinere Zahl steht weiter oben. Angezeigt
werden die vier wichtigsten Tipps für heute, drei je Folgetag.

Verfügbare Werte pro Tag: `max`, `min`, `feels`, `pop`, `mm`, `snow`, `uv`,
`wind`, `gust`, `kind` (`clear`, `rain`, `snow`, `thunder`, `fog` …) und
`d.rainWindows` (die Regenzeitfenster, z. B. `[{from:10, to:15}]`).

## Fallstricke beim Weiterbauen

- **RainViewer liefert nur bis Zoomstufe 7 echte Radarbilder** (mit
  512-px-Kacheln), darüber kommt eine graue Platzhalter-Kachel mit
  „Zoom Level Not Supported". Deshalb `maxNativeZoom: 8` am Radar-Layer –
  Leaflet skaliert dann weich hoch. Nicht hochsetzen.
- **ICON kennt keinen UV-Index.** Der kommt aus einem zweiten Aufruf ohne
  Modellvorgabe. Schlägt der fehl, läuft die App ohne UV weiter.
- **`fetch` hat keinen eingebauten Timeout.** Ohne den `AbortController` in
  `getJSON()` hängt die App in einem schlechten Netz für immer im
  Ladezustand, statt auf die gespeicherten Daten zurückzufallen.
- **Kartenkacheln:** CARTO verlangt inzwischen einen API-Key, und
  OpenStreetMap blockt Apps, die direkt von deren Servern laden (403 „App is
  not following the tile usage policy"). Deshalb Esri Dark Gray Canvas.
- **Zeitzonen:** Open-Meteo liefert Zeiten als Ortszeit *ohne*
  Zeitzonen-Kennung (`2026-09-01T06:32`). Nie mit `new Date()` parsen –
  entweder direkt als Text verwenden oder über `state.tzOffset` umrechnen.
  Die Mondzeiten rechnen intern in UTC und werden erst beim Anzeigen in
  Ortszeit formatiert.
- **Service Worker:** Nach jeder Änderung an der App die `VERSION` in
  `sw.js` hochzählen, sonst bekommen installierte Geräte die alte Fassung.

## Dateien

```
index.html              die ganze App
manifest.webmanifest    macht sie installierbar
sw.js                   Offline-Betrieb, Zwischenspeicher
icons/                  App-Symbole
```

## Nächste Ausbaustufen

- Mehrere gespeicherte Orte zum Durchwischen
- Unwetterwarnungen des DWD einbinden
- Push-Nachricht am Morgen mit dem Tipp des Tages (braucht einen kleinen Server)
