# 致敬与免责声明 / Fan Project Disclaimer

## 中文

本项目是对 Edmund McMillen 与 Florian Himsl 的《The Binding of Isaac》
（以及由 Nicalis 发行的《Rebirth》）的**非官方、非商业同人复刻**，
与原作者、发行商均无关联，也未获得其授权或背书。

**本仓库不包含原作的任何美术、音频或代码资源。**

- 所有图形都是运行时用 Canvas 2D API 现场绘制的（见 `js/art.js`）
- 所有音效都是运行时用 WebAudio API 现场合成的（见 `js/util.js`）
- 道具名、敌人名、Boss 名沿用原作，仅为便于和原作机制对照

机制实现参考的是公开资料：
[Boris the Brave 对原作地牢生成算法的逆向分析](https://www.boristhebrave.com/2020/09/12/dungeon-generation-in-binding-of-isaac/)
与 [Binding of Isaac Rebirth Wiki](https://bindingofisaacrebirth.fandom.com/)。

如果你喜欢这套玩法，请去支持[原作](https://store.steampowered.com/app/250900/)。

本项目代码以 [MIT](LICENSE) 许可开放。若权利人认为本项目有任何不当之处，
请提 issue 说明，我会配合处理。

## English

This is an unofficial, non-commercial fan tribute to *The Binding of Isaac* by
Edmund McMillen and Florian Himsl (and *Rebirth*, published by Nicalis). It is
not affiliated with, endorsed by, or sponsored by them.

**No original art, audio, or code assets from the original game are included in
this repository.** All graphics are drawn procedurally at runtime with the
Canvas 2D API (`js/art.js`); all sound effects are synthesized at runtime with
the WebAudio API (`js/util.js`). Item, enemy, and boss names are reused only so
that mechanics can be compared against the original.

Mechanics were implemented from public sources: Boris the Brave's
[reverse-engineering of the original dungeon generation algorithm](https://www.boristhebrave.com/2020/09/12/dungeon-generation-in-binding-of-isaac/)
and the [Binding of Isaac Rebirth Wiki](https://bindingofisaacrebirth.fandom.com/).

Please support the [original game](https://store.steampowered.com/app/250900/).
The code in this repository is released under the [MIT](LICENSE) license. If any
rights holder has concerns, please open an issue and I will address them.
