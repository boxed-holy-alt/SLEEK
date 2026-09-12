# SLEEK local games

These games are vendored and served locally by SLEEK. The game code and assets remain under their original licenses.

- `2048`: https://github.com/2048-game/2048, MIT License, copyright Gabriele Cirulli.
- `asteroids`: https://github.com/dmcinnes/HTML5-Asteroids, MIT-style license, copyright Doug McInnes.
- `hextris`: https://github.com/Hextris/hextris, GNU GPL v3.
- `pacman`: https://github.com/mumuy/pacman, MIT License, copyright Haole Zheng.
- `isaac`: https://github.com/liyupi/binding-of-isaac-webgame, MIT License.
- `dungeon`: https://github.com/redpangilinan/dungeon-crawler-rpg-od, GNU GPL v3.

Do not remove the license files shipped with each game directory when redistributing SLEEK.

## Large GitHub catalog

For the large ported-games catalog, the proxy discovers repositories from `SLEEK_GAMES_DIRECTORIES` (a path-delimited list). In the development container it automatically uses:

- `/tmp/sleek-games-sources/seraph/games`
- `/tmp/sleek-games-sources/selenite-old`
- `/tmp/sleek-games-sources/part1` through `/tmp/sleek-games-sources/part7`

Those sources currently expose 1,235 HTML game entries through `/api/games/catalog`; they are not copied into this repository because the checkout is many gigabytes. Set `SLEEK_GAMES_DIRECTORIES` to the corresponding local clones when running SLEEK elsewhere.
