# 抓奶蛙

3D 三消小游戏：把盆里的东西三个一样收进栏里消除，清空整盆，抓出盆底的宇宙奶蛙。

## 文件

- `index.html`：游戏本体（图片素材已内嵌）
- `lib/three.min.js`、`lib/cannon.min.js`：3D 渲染和物理引擎，放在本地，国内打开更稳
- `zanshang.jpg`：赞赏码

## 发布到 GitHub Pages

1. 登录 GitHub，右上角 **+** → **New repository**，仓库名填 `zhua-nai-wa`，选 **Public**，点 **Create repository**。
2. 在新仓库页面点 **uploading an existing file**，把这个文件夹里的所有文件（包括 `lib` 文件夹）拖进去，点 **Commit changes**。
3. 进入仓库的 **Settings** → 左侧 **Pages**。在 **Branch** 下选 `main`、文件夹选 `/ (root)`，点 **Save**。
4. 等 1 到 2 分钟，刷新这个页面，顶部会出现网址：`https://你的用户名.github.io/zhua-nai-wa/`。

以后要更新游戏，把新的 `index.html` 再上传一次覆盖就行，网址不变。

## 存档说明

图鉴、排行榜和关卡解锁都保存在玩家自己的浏览器里。每个人第一次打开都从零开始，进度互不影响。清除浏览器数据或者换手机，进度会重置。
