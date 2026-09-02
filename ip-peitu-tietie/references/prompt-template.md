# 生图提示词模板

每张图单独生成。根据正文内容替换变量，不要把多张图拼在一起。生成前对照 `assets/character-sheet/00-character-sheet.png` 锁帖帖。

```text
Generate one standalone 16:9 horizontal Chinese article illustration.

Visual DNA:
A doodle page torn from an old scrapbook / retro journal. Full-canvas light cream aged paper with subtle light fiber grain (readable, not dirty kraft). Black ink hand-drawn lines, slightly wobbly, optional light hatching. Sparse retro-colored semantic stickers or washi tape (at most 2-3, each must mean something structurally). Warm, nostalgic, never flashy. No pure white product-sketch background. No red-orange-blue infographic color system. No gradients, no heavy shadows, no commercial vector style, no PPT, no cute mascot poster, no chibi winking robot, no children's illustration, no realistic UI.

Recurring IP character required:
帖帖 (Tie-tie), a living torn-edge sticker creature matching assets/character-sheet/00-character-sheet.png. Body is a near-round terracotta / burnt-sienna sticker cutout with serrated or scalloped torn edges, thin like paper in side view, NOT a solid-black bean. Round face with two simple black-ink dot eyes, thin ink-line limbs. Slight scrapbook-doodle cuteness OK, but no wink, no chibi robot, no screen face, no sparkle field. At most ONE small hand-drawn star on or beside 帖帖 as an emotion mark. 帖帖 must BECOME part of the core structure by tearing, pasting, or rolling into it (funnel / door / tube), not decorate the corner. After morphing, still recognizable by: torn serrated edge + round face + terracotta body.

Theme:
{正文配图主题}

Structure type:
{结构类型：Workflow / 系统局部 / 前后对比 / 角色状态 / 概念隐喻 / 方法分层 / 地图路线 / 小漫画分镜}

Core idea:
{这张图要表达的核心意思}

Composition:
{具体画面：帖帖在哪里、如何变成结构的一部分、主要物件是什么、信息如何流动}

Suggested elements:
{主池元素1} / {主池元素2} / {可选辅池元素，仅当正文在讲系统}

Chinese handwritten labels:
{标注词1} / {标注词2} / {标注词3} / {标注词4} / {可选标注词5}

Color use:
Black ink for line art, facial features, limbs, and most handwritten Chinese labels. Terracotta / rust-red for 帖帖's sticker body AND at most a few emphasis labels (problem, breakpoint, result). Dusty muted blue ONLY for washi tape or auxiliary technical objects — never for text. Do not use the old orange-flow / blue-notes / red-warning infographic system.

Constraints:
One image explains only one core structure. Keep the main subject around 40%-60% of the canvas. Preserve at least 35% quiet paper. Use at most 5-8 short handwritten Chinese labels. At most 2-3 semantic stickers/tapes. Do not write a title in the top-left corner. Do not write the structure type on the image. Do not copy the style-ref robot-at-desk or gears-and-database compositions. Do not draw 小黑 or 糖糖. Invent a fresh visual metaphor for this specific article. Strange but warm, clear but not instructional, a little cute but never flashy.
```

## 图像编辑提示

去掉左上角标题：

```text
Edit the provided image. Remove only the handwritten title "{要删除的文字}" and its underline from the top-left corner. Fill that area with the same light cream scrapbook paper, matching the surrounding page. Preserve everything else exactly: 帖帖, labels, stickers, line style, composition, aspect ratio, and image quality. Do not add any new text or objects.
```

让帖帖成为结构本身：

```text
Regenerate this illustration with the same core meaning and simple layout, but make 帖帖 the torn terracotta sticker that performs the conceptual action — tearing into a funnel, pasting as a door, or rolling into a tube. Keep torn-edge + round face + terracotta body recognizable. Keep it a quiet retro journal page: black ink, sparse semantic stickers, not cute-robot, not PPT.
```

纸纹太浓或字不可读：

```text
Edit the provided image. Lighten the paper grain so short handwritten Chinese labels stay readable. Keep the cream scrapbook page, 帖帖, stickers, and composition. Do not add decorations.
```
