# 截图画廊

本页所有画面里的**每一个像素都是代码画出来的**——没有一张贴图、没有一个精灵表、
没有任何外部美术资源。地板是每进一间房烘焙一次的离屏 canvas，角色和敌人是一层层
`arc` / `bezierCurveTo` 叠出来的，血渍和骨骸是播种随机撒的。

截图由 `test/gallery.py` 与 `test/visual.py` 自动摆拍生成，可复现。
图看着不过瘾的话，直接去玩：**<https://yisa.codefather.cn>**

- [一局游戏的全过程](#一局游戏的全过程)
- [12 层章节巡礼](#12-层章节巡礼)
- [13 个 Boss](#13-个-boss)
- [战斗与构筑细节](#战斗与构筑细节)
- [移动端](#移动端)
- [自动化测试留影](#自动化测试留影)

---

## 一局游戏的全过程

<table>
<tr>
<td width="50%"><img src="../screenshots/01-title.png" alt="标题界面"><br><b>标题界面</b><br>永久流泪的下垂眼、砖墙背景、暖光晕，全部实时绘制</td>
<td width="50%"><img src="../screenshots/02-start-room.png" alt="起始房间"><br><b>起始房间</b><br>左上血量、右上小地图、左下常驻属性面板</td>
</tr>
<tr>
<td><img src="../screenshots/03-shooting.png" alt="发射眼泪"><br><b>发射眼泪</b><br>眼泪继承部分玩家速度，带高度与落地飞溅</td>
<td><img src="../screenshots/04-combat-room.png" alt="战斗房"><br><b>战斗房</b><br>进房门即关闭，清空敌人才开门</td>
</tr>
<tr>
<td><img src="../screenshots/05-room-cleared.png" alt="房间清空"><br><b>房间清空</b><br>掉落金币、地面留下永久血渍</td>
<td><img src="../screenshots/07-treasure-room.png" alt="宝物房"><br><b>宝物房</b><br>基座上的道具必得，金色门 + 星星标记</td>
</tr>
<tr>
<td><img src="../screenshots/08-item-picked.png" alt="拾取道具"><br><b>拾取道具</b><br>道具名与效果说明浮现，属性面板同步变化</td>
<td><img src="../screenshots/19-shop.png" alt="商店"><br><b>商店</b><br>第 2 层起出现，三个货架，价格随深度上涨</td>
</tr>
<tr>
<td><img src="../screenshots/10-boss-fight.png" alt="Boss 战"><br><b>Boss 战</b><br>底部血条 + Boss 名，房间锁死</td>
<td><img src="../screenshots/11-boss-defeated.png" alt="击败 Boss"><br><b>击败 Boss</b><br>奖励道具 + 通往下一层的活板门</td>
</tr>
<tr>
<td><img src="../screenshots/13-death-screen.png" alt="死亡界面"><br><b>死亡界面</b><br>六项统计 + 本局道具清单</td>
<td><img src="../screenshots/14-win-screen.png" alt="通关界面"><br><b>通关界面</b><br>打穿 12 层后逃出地下室</td>
</tr>
</table>

---

## 12 层章节巡礼

层数与命名沿用原作的下坠路线。每层有独立配色、独立地板烘焙、独立敌人池和独立 Boss 池。

<table>
<tr>
<td width="50%"><img src="../screenshots/L01-basement.png" alt="Basement"><br><b>L1 · BASEMENT</b><br>棕石地砖，逐格随机石色 + 颗粒噪点 + 裂纹</td>
<td width="50%"><img src="../screenshots/L02-cellar.png" alt="Cellar"><br><b>L2 · CELLAR</b><br>更亮的木色，密集蛛网</td>
</tr>
<tr>
<td><img src="../screenshots/L03-caves.png" alt="Caves"><br><b>L3 · CAVES</b><br>灰绿岩石</td>
<td><img src="../screenshots/L04-catacombs.png" alt="Catacombs"><br><b>L4 · CATACOMBS</b><br>冷灰石，地面骨骸，墙里嵌头骨</td>
</tr>
<tr>
<td><img src="../screenshots/L05-depths.png" alt="Depths"><br><b>L5 · DEPTHS</b><br>紫黑石</td>
<td><img src="../screenshots/L06-necropolis.png" alt="Necropolis"><br><b>L6 · NECROPOLIS</b><br>暗红石 + 骨骸</td>
</tr>
<tr>
<td><img src="../screenshots/L07-womb.png" alt="Womb"><br><b>L7 · WOMB</b><br><b>整套烘焙换掉</b>：没有地砖网格，改成层叠血肉瓣 + 爬行血管 + 毛孔，墙面改用搏动的膜</td>
<td><img src="../screenshots/L08-utero.png" alt="Utero"><br><b>L8 · UTERO</b><br>更深的血肉</td>
</tr>
<tr>
<td><img src="../screenshots/L09-bluewomb.png" alt="???"><br><b>L9 · ? ? ?</b><br>冷蓝血肉，血管改为发光</td>
<td><img src="../screenshots/L10-sheol.png" alt="Sheol"><br><b>L10 · SHEOL</b><br>焦黑地面，烧出余烬光斑</td>
</tr>
<tr>
<td><img src="../screenshots/L11-cathedral.png" alt="Cathedral"><br><b>L11 · CATHEDRAL</b><br>白色大理石 + 彩窗拱门的暖光</td>
<td><img src="../screenshots/L12-chest.png" alt="The Chest"><br><b>L12 · THE CHEST</b><br>金木色，终点</td>
</tr>
</table>

---

## 13 个 Boss

每个 Boss 都是独立的状态机 + 独立的程序化绘图，不是换色的同一个模型。

<table>
<tr>
<td width="50%"><img src="../screenshots/BOSS-monstro.png" alt="Monstro"><br><b>MONSTRO</b> · L1, L2<br>蓄力压扁 → 跳跃冲撞、呕吐散射、高跳砸向落点（红圈预警）+ 环形弹幕，半血狂暴</td>
<td width="50%"><img src="../screenshots/BOSS-duke.png" alt="Duke of Flies"><br><b>DUKE OF FLIES</b> · L1, L3<br>悬空漂移，召唤苍蝇群、环形吐弹、直线冲刺</td>
</tr>
<tr>
<td><img src="../screenshots/BOSS-larry.png" alt="Larry Jr."><br><b>LARRY JR.</b> · L2, L4<br>5 节身躯，只走四方向、撞墙朝玩家转向；整条身体都能打也都伤人</td>
<td><img src="../screenshots/BOSS-chub.png" alt="Chub"><br><b>CHUB</b> · L3, L5<br>三节肥虫，与你在某一轴对齐时张嘴蓄力然后高速冲撞，撞墙炸出弹幕</td>
</tr>
<tr>
<td><img src="../screenshots/BOSS-gurdy.png" alt="Gurdy"><br><b>GURDY</b> · L4, L6<br>钉死在房间顶部的肉瘤墙，5 连扇形弹 / 环形弹 / 召唤飞行小怪</td>
<td><img src="../screenshots/BOSS-monstroII.png" alt="Monstro II"><br><b>MONSTRO II</b> · L5, L7<br>两连跳砸、扫射式血腥激光、召唤 Maw / Boom Fly</td>
</tr>
<tr>
<td><img src="../screenshots/BOSS-mom.png" alt="Mom"><br><b>MOM</b> · L6<br>天花板伸下的巨腿，影子锁定后踩击（连石头一起踩碎），只有落地窗口能被打伤；门缝里的眼睛持续点射</td>
<td><img src="../screenshots/BOSS-scolex.png" alt="Scolex"><br><b>SCOLEX</b> · L7, L8<br>钢甲蠕虫，<b>只有闪光的尾节能被打</b>，大部分时间钻地无敌</td>
</tr>
<tr>
<td><img src="../screenshots/BOSS-momsHeart.png" alt="Mom's Heart"><br><b>MOM'S HEART</b> · L8<br>顶部悬吊的心脏，四套弹幕交替 + 召唤小怪波次，60% 血进二阶段</td>
<td><img src="../screenshots/BOSS-hush.png" alt="Hush"><br><b>HUSH</b> · L9<br>每掉 20% 血就沉入地面清屏并换位；带缺口的密集弹环、旋转齐射、四向激光十字</td>
</tr>
<tr>
<td><img src="../screenshots/BOSS-satan.png" alt="Satan"><br><b>SATAN</b> · L10<br>三阶段：扇形连射 → 双手半环弹 + 横扫激光 → 离地踩击 + 召唤爆炸蝇</td>
<td><img src="../screenshots/BOSS-isaacBoss.png" alt="Isaac"><br><b>ISAAC</b> · L11<br>三阶段：辐射弹 / 弧线回旋弹 → 激光十字 → 长出翅膀预判走位冲刺</td>
</tr>
<tr>
<td><img src="../screenshots/BOSS-blueBaby.png" alt="???"><br><b>? ? ?（BLUE BABY）</b> · L12<br>最终 Boss。与 Isaac 同形但更快，<b>所有子弹带追踪</b>，持续召唤环绕苍蝇，六向激光 + 冲刺</td>
<td valign="top"><img src="../screenshots/E-duke-caves.png" alt="Caves 里的 Duke"><br><b>同一个 Boss，不同章节</b><br>Boss 池是两选一的，同一层两次进去不一定遇到同一个 Boss；换层后配色与地形也跟着变</td>
</tr>
</table>

---

## 战斗与构筑细节

<table>
<tr>
<td width="50%"><img src="../screenshots/A-enemy-lineup.png" alt="敌人"><br><b>普通敌人</b><br>共 11 种，移动与攻击模式各不相同：直线追击、悬空游走、完全固定、撞墙反弹、跳跃逼近、死亡爆炸、正面免伤……</td>
<td width="50%"><img src="../screenshots/B-combat-feedback.png" alt="命中反馈"><br><b>命中反馈</b><br>命中停顿（冻结几帧）、受击白红描边闪烁、血液粒子、击退、屏幕震动</td>
</tr>
<tr>
<td><img src="../screenshots/C-monstro-vomit.png" alt="Monstro 呕吐"><br><b>弹幕：Monstro 的呕吐散射</b></td>
<td><img src="../screenshots/D-monstro-slam.png" alt="Monstro 砸地"><br><b>预警：Monstro 高跳砸地</b><br>红圈提示落点，落地同时环形弹幕</td>
</tr>
<tr>
<td><img src="../screenshots/H-brimstone-laser.png" alt="Brimstone"><br><b>Brimstone</b><br>拿到后射击变成蓄力血腥激光，横扫整个房间</td>
<td><img src="../screenshots/09-brimstone.png" alt="Brimstone 实战"><br><b>Brimstone 实战</b><br>55 件道具里有 21 件会直接改变攻击方式</td>
</tr>
<tr>
<td><img src="../screenshots/Y-familiars.png" alt="跟班与外观"><br><b>道具改变外观</b><br>跟班小人自动开火、Holy Mantle 护盾泡、The Mark 脚下血印、光环、恶魔翅膀</td>
<td><img src="../screenshots/smoke-allitems.png" alt="全道具叠加"><br><b>55 件道具一口气全叠加</b><br>冒烟测试的极端场景，确认没有互相打架的效果</td>
</tr>
<tr>
<td><img src="../screenshots/G-treasure.png" alt="宝物房"><br><b>宝物房基座</b></td>
<td><img src="../screenshots/F-depths-loaded.png" alt="Depths 满载"><br><b>深层的房间密度</b><br>房间数随深度从 5–6 间增长到 13 间</td>
</tr>
</table>

---

## 移动端

竖屏可玩，横屏画面更大（竖屏会提示旋转）。左下角虚拟摇杆是 360° 模拟量，右下角四向按钮射击。

<table>
<tr>
<td width="33%"><img src="../screenshots/18-mobile-landscape.png" alt="横屏"><br><b>横屏</b></td>
<td width="33%"><img src="../screenshots/17-mobile-portrait-fixed.png" alt="竖屏"><br><b>竖屏</b></td>
<td width="33%"><img src="../screenshots/16-mobile-shooting.png" alt="触控射击"><br><b>触控射击</b></td>
</tr>
</table>

---

## 自动化测试留影

测试全部用 Playwright 真实驱动页面——真键盘 `keyboard.down/up`、真触控 `mouse`，
而不是直接调用内部函数。`test/bot.js` 是一个只通过和人类相同的输入接口
（`__game.press/release/move`）操作的页面内机器人。

<table>
<tr>
<td width="50%"><img src="../screenshots/bot-run-1.png" alt="机器人试玩"><br><b>机器人全流程试玩</b><br>它自己会瞄准前先在某一轴对齐、风筝拉距、躲眼泪、绕坑洞、Boss 蓄力时侧向拉开</td>
<td width="50%"><img src="../screenshots/fight-L12-blueBaby.png" alt="最终 Boss 实战"><br><b>最终 Boss 实战</b><br>机器人在无无敌状态下击杀 6347 血的 ? ? ?，耗时 74.6 秒</td>
</tr>
</table>

完整测试结论见 [README 的自测结果章节](../README.md#自测结果)。
