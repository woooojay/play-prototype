/* Play — asset library & content data.
   Everything a user can click, drag or pick on the homepage lives here,
   so growing the library is a data change, not a code change. */
window.PLAY = window.PLAY || {};
(function (P) {
  // How many generated pages a visitor sees before the sign-up gate.
  P.FREE_PAGES = 3;

  // Play's own brand palette (the homepage chrome + footer tokens).
  P.BRAND = [
    { name: '墨', en: 'Ink', hex: '#15121A' },
    { name: '纸', en: 'Paper', hex: '#F3EEE5' },
    { name: '番茄', en: 'Tomato', hex: '#FF4D1F' },
    { name: '钴蓝', en: 'Cobalt', hex: '#2F3BFF' },
    { name: '青柠', en: 'Lime', hex: '#D5F53F' },
    { name: '泡泡糖', en: 'Bubblegum', hex: '#FFA3D1' },
    { name: '向日葵', en: 'Sun', hex: '#FFC83D' },
  ];

  // A style = typography + layout + decoration (see css/slides.css) + default colours.
  P.THEMES = [
    { id: 'bauhaus', name: '包豪斯', en: 'Bauhaus', colors: { bg: '#F1E7D3', fg: '#191714', a1: '#E3392B', a2: '#1E4FA0', a3: '#F4B400' } },
    { id: 'swiss', name: '瑞士网格', en: 'Swiss', colors: { bg: '#FFFFFF', fg: '#0F0F0F', a1: '#FF2A12', a2: '#0F0F0F', a3: '#E9E9E9' } },
    { id: 'memphis', name: '孟菲斯', en: 'Memphis', colors: { bg: '#FFF4E4', fg: '#24124A', a1: '#FF4FA0', a2: '#13C6C2', a3: '#FFCF2E' } },
    { id: 'editorial', name: '杂志', en: 'Editorial', colors: { bg: '#F2ECE1', fg: '#1D1A16', a1: '#B5381B', a2: '#6D6458', a3: '#DCD2C0' } },
    { id: 'neon', name: '霓虹', en: 'Neon', colors: { bg: '#0C0820', fg: '#F4EEFF', a1: '#FF2BD6', a2: '#18EEFF', a3: '#7B5CFF' } },
    { id: 'ink', name: '水墨', en: 'Ink', colors: { bg: '#F0E9DA', fg: '#171513', a1: '#C4321E', a2: '#5E5851', a3: '#DCD2BF' } },
    { id: 'jelly', name: '果冻', en: 'Y2K Jelly', colors: { bg: '#ECE6FF', fg: '#1D1442', a1: '#FF6EC4', a2: '#5ADFFF', a3: '#C8FF5E' } },
    { id: 'brutal', name: '野兽派', en: 'Brutal', colors: { bg: '#D7FF3B', fg: '#0A0A0A', a1: '#FF4D00', a2: '#0A0A0A', a3: '#FFFFFF' } },
  ];

  // Play palettes: bg / fg must read well together; a1 is the strongest accent.
  P.PALETTES = [
    { id: 'tomato', name: '番茄炒蛋', bg: '#FFF3DF', fg: '#2A1508', a1: '#EE3F1B', a2: '#FFBE1A', a3: '#3E7D3A' },
    { id: 'klein', name: '克莱因蓝', bg: '#F3F2EC', fg: '#0B1030', a1: '#002FA7', a2: '#FFB000', a3: '#C9CCD8' },
    { id: 'mint', name: '薄荷苏打', bg: '#E4FBF2', fg: '#06393A', a1: '#00A88F', a2: '#FF7A59', a3: '#9EE8D4' },
    { id: 'morandi', name: '莫兰迪', bg: '#E8E3DC', fg: '#3A3735', a1: '#8E6F6A', a2: '#A3B5A6', a3: '#8E9AAF' },
    { id: 'palace', name: '故宫红', bg: '#F5ECDB', fg: '#2A1A16', a1: '#A6262B', a2: '#D49B2E', a3: '#2F5755' },
    { id: 'dopamine', name: '多巴胺', bg: '#FFF7EE', fg: '#1A1A1A', a1: '#FF2E9A', a2: '#22C77F', a3: '#FFD400' },
    { id: 'izakaya', name: '深夜食堂', bg: '#1B1410', fg: '#F6E8D2', a1: '#FF8A3D', a2: '#E2462B', a3: '#7A5A40' },
    { id: 'sakura', name: '樱花汽水', bg: '#FFF0F5', fg: '#4A1832', a1: '#F0609A', a2: '#6BB6FF', a3: '#FFD1E0' },
    { id: 'forest', name: '森林浴', bg: '#ECF1E3', fg: '#1D2C1D', a1: '#3A6B35', a2: '#C79A3A', a3: '#A8C098' },
    { id: 'lemon', name: '柠檬气泡', bg: '#FFFBD6', fg: '#1E2600', a1: '#0098E0', a2: '#E2EE1E', a3: '#FF5964' },
    { id: 'sunset', name: '落日飞车', bg: '#2A1A3E', fg: '#FFE8D4', a1: '#FF6B35', a2: '#F7C59F', a3: '#9B5DE5' },
    { id: 'seasalt', name: '海盐', bg: '#E9F3F7', fg: '#11314A', a1: '#1F7A8C', a2: '#F4A259', a3: '#BFDBF0' },
    { id: 'blackgold', name: '黑金', bg: '#0F0F11', fg: '#EEE6D3', a1: '#CBA135', a2: '#8A8473', a3: '#2C2C31' },
    { id: 'cyber', name: '赛博朋克', bg: '#0D0221', fg: '#F6F0FF', a1: '#FF0A8C', a2: '#00EEFF', a3: '#FCEE0A' },
    { id: 'kraft', name: '牛皮纸', bg: '#E7D7B8', fg: '#2C2317', a1: '#B0502A', a2: '#4A5A3A', a3: '#C9B48A' },
    { id: 'mono', name: '黑白灰', bg: '#FFFFFF', fg: '#0A0A0A', a1: '#0A0A0A', a2: '#8A8A8A', a3: '#E6E6E6' },
  ];

  // Background textures — drawn in CSS from the slide's own colours.
  P.BGS = [
    { id: 'none', name: '纯色' },
    { id: 'dots', name: '波点' },
    { id: 'grid', name: '方格纸' },
    { id: 'stripes', name: '斜纹' },
    { id: 'checker', name: '棋盘' },
    { id: 'waves', name: '波浪' },
    { id: 'rings', name: '涟漪' },
    { id: 'grain', name: '颗粒' },
    { id: 'halftone', name: '网点' },
    { id: 'confetti', name: '彩纸屑' },
    { id: 'mesh', name: '弥散光' },
    { id: 'sunburst', name: '放射' },
  ];

  const burst = (n, r1, r2) => {
    const pts = [];
    for (let k = 0; k < n * 2; k++) {
      const a = (Math.PI * k) / n - Math.PI / 2;
      const r = k % 2 ? r2 : r1;
      pts.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (50 + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  };
  const petals = [0, 60, 120, 180, 240, 300]
    .map(d => {
      const a = (d * Math.PI) / 180;
      return `<circle cx="${(50 + 27 * Math.cos(a)).toFixed(1)}" cy="${(50 + 27 * Math.sin(a)).toFixed(1)}" r="21"/>`;
    })
    .join('');

  // Stickers: drawn in currentColor, details pick up the slide's --bg / --fg / --a2 / --a3.
  P.STICKERS = [
    { id: 'star', name: '星星', svg: '<polygon points="50,4 61,37 96,37 68,58 79,93 50,72 21,93 32,58 4,37 39,37"/>' },
    { id: 'sparkle', name: '闪光', svg: '<path d="M50 0C54 34 66 46 100 50C66 54 54 66 50 100C46 66 34 54 0 50C34 46 46 34 50 0Z"/>' },
    { id: 'flower', name: '小花', svg: petals + '<circle cx="50" cy="50" r="15" style="fill:var(--bg)"/>' },
    { id: 'smiley', name: '笑脸', svg: '<circle cx="50" cy="50" r="46"/><circle cx="35" cy="40" r="6" style="fill:var(--fg)"/><circle cx="65" cy="40" r="6" style="fill:var(--fg)"/><path d="M29 59Q50 82 71 59" fill="none" stroke-width="7" stroke-linecap="round" style="stroke:var(--fg)"/>' },
    { id: 'burst', name: '爆炸', svg: `<polygon points="${burst(12, 49, 33)}"/>` },
    { id: 'new', name: 'NEW', svg: `<polygon points="${burst(14, 49, 41)}"/><text x="50" y="59" text-anchor="middle" font-size="24" style="fill:var(--bg);font-family:'Archivo Black','Bricolage Grotesque',sans-serif">NEW</text>` },
    { id: 'wow', name: '哇', svg: '<path d="M50 6C76 6 94 22 94 44C94 66 76 80 52 80L30 96L34 77C16 71 6 59 6 44C6 22 24 6 50 6Z"/><text x="50" y="56" text-anchor="middle" font-size="32" style="fill:var(--bg);font-family:\'ZCOOL KuaiLe\',\'PingFang SC\',sans-serif">哇!</text>' },
    { id: 'heart', name: '爱心', svg: '<path d="M50 90C20 66 4 49 4 30C4 15 16 5 29 5C38 5 45 10 50 18C55 10 62 5 71 5C84 5 96 15 96 30C96 49 80 66 50 90Z"/>' },
    { id: 'arrow', name: '箭头', svg: '<path d="M12 74C26 30 58 18 84 36" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><path d="M60 30L86 38L80 12" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' },
    { id: 'squiggle', name: '波浪线', svg: '<path d="M6 54Q16 30 26 54T46 54T66 54T86 54" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>' },
    { id: 'bolt', name: '闪电', svg: '<polygon points="58,2 16,56 44,56 36,98 84,40 56,40 66,2"/>' },
    { id: 'asterisk', name: '星号', svg: '<rect x="41" y="4" width="18" height="92" rx="9"/><rect x="41" y="4" width="18" height="92" rx="9" transform="rotate(60 50 50)"/><rect x="41" y="4" width="18" height="92" rx="9" transform="rotate(120 50 50)"/>' },
    { id: 'crown', name: '皇冠', svg: '<path d="M8 78L14 26L34 50L50 14L66 50L86 26L92 78Z"/><rect x="8" y="83" width="84" height="10" rx="3"/>' },
    { id: 'eye', name: '眼睛', svg: '<path d="M4 50Q50 4 96 50Q50 96 4 50Z"/><circle cx="50" cy="50" r="19" style="fill:var(--bg)"/><circle cx="50" cy="50" r="10" style="fill:var(--fg)"/>' },
    { id: 'rainbow', name: '彩虹', svg: '<path d="M8 82A42 42 0 0 1 92 82" fill="none" stroke="currentColor" stroke-width="11"/><path d="M23 82A27 27 0 0 1 77 82" fill="none" stroke-width="11" style="stroke:var(--a2)"/><path d="M38 82A12 12 0 0 1 62 82" fill="none" stroke-width="11" style="stroke:var(--a3)"/>' },
    { id: 'blob', name: '果冻', svg: '<path d="M71 12C86 22 96 41 90 60C84 79 64 92 44 90C24 88 6 72 8 51C10 30 26 14 44 9C54 6 62 7 71 12Z"/>' },
  ];

  /* Slide model
     layout: cover | statement | bullets | stat | quote | end
     fields: kicker, title, sub, meta, bullets[], stat, statLabel, quote, author */

  // The deck that plays in the hero — Play explaining itself.
  P.DEMO = {
    title: 'Play 是什么',
    slides: [
      { layout: 'cover', kicker: 'Play · 2026', title: '别描述，直接玩', sub: '一个能玩起来的设计 AI：上传 PPT、点选风格，几秒钟看到成品。', meta: 'Playground Edition' },
      { layout: 'statement', kicker: '核心想法', title: '同一份内容，换一种活法', sub: '点一下换风格，拖一下换配色，再贴一个贴纸。' },
      { layout: 'bullets', kicker: '怎么玩', title: '三步，从无聊到好看', bullets: ['上传你的 PPT，或挑一个模板', '点选喜欢的风格、配色和素材', '前 3 页免费生成，马上看到成品'] },
      { layout: 'stat', kicker: '为什么不同', title: '从打开首页到看到成品', stat: '30 秒', statLabel: '不需要先想好提示词，也不用先注册' },
      { layout: 'quote', quote: '设计，不该从一个空白对话框开始。', author: 'Play 设计原则 #1' },
      { layout: 'bullets', kicker: '资产库', title: '一个会长大的风格库', bullets: ['8 套风格 × 16 套配色 × 12 种背景', '你点过、收藏过的，就是你的口味', 'AI 按你的口味扩展出新组合', '每次生成，都能变成一张分享卡'] },
      { layout: 'end', title: '轮到你了', sub: '把你的 PPT 拖进来试试 →' },
    ],
  };

  P.TEMPLATES = [
    {
      id: 'pitch', name: '融资路演', theme: 'brutal',
      deck: {
        title: '小铺 AI 融资路演',
        slides: [
          { layout: 'cover', kicker: 'Seed Round · 2026', title: '让每家小店都有自己的设计师', sub: '小铺 AI · 融资路演', meta: '创始人 林一 · 2026.11' },
          { layout: 'bullets', kicker: '问题', title: '小商家的设计，又贵又慢', bullets: ['一张海报外包要 3 天、800 元', '模板网站千篇一律，一眼就假', '老板没时间学设计软件'] },
          { layout: 'stat', kicker: '市场', title: '中国本地生活商户', stat: '1.2 亿', statLabel: '每家店每年都要做菜单、海报、门头和外卖图' },
          { layout: 'bullets', kicker: '产品', title: '拍一张照片，生成一整套物料', bullets: ['菜单、海报、门头一次出齐', '自动套用店铺品牌色', '打印尺寸、外卖平台尺寸一键导出'] },
          { layout: 'stat', kicker: '增长', title: '上线 6 个月', stat: '38%', statLabel: '月环比增长 · 付费率 11%' },
          { layout: 'quote', quote: '以前做一张海报等三天，现在等三十秒。', author: '杭州 · 阿芳面馆老板' },
          { layout: 'end', title: '谢谢', sub: '本轮融资 ¥3000 万 · 期待和你聊聊' },
        ],
      },
    },
    {
      id: 'annual', name: '年终总结', theme: 'swiss',
      deck: {
        title: '增长组 2026 年度总结',
        slides: [
          { layout: 'cover', kicker: '2026 年度总结', title: '增长组的一年', sub: '数字、教训，和明年只做的三件事', meta: '增长组 · 12 月' },
          { layout: 'stat', kicker: '核心指标', title: '全年新增用户', stat: '214 万', statLabel: '完成年度目标的 128%' },
          { layout: 'bullets', kicker: '做对了', title: '做对的三件事', bullets: ['把新手引导缩短到 3 步', '每周一次增长实验复盘', '和内容团队共建投放素材库'] },
          { layout: 'bullets', kicker: '踩过的坑', title: '踩过的坑', bullets: ['Q2 渠道过度集中', 'A/B 实验样本量不足', '数据看板口径不统一'] },
          { layout: 'statement', kicker: '2027', title: '明年只做三件事', sub: '留存 · 推荐 · 国际化' },
          { layout: 'end', title: '谢谢大家', sub: '问答时间' },
        ],
      },
    },
    {
      id: 'launch', name: '产品发布会', theme: 'neon',
      deck: {
        title: 'Orbit 一号发布会',
        slides: [
          { layout: 'cover', kicker: 'Launch Event', title: 'Orbit 一号', sub: '戴在耳朵上的 AI 助理', meta: '2026.12.08 · 上海' },
          { layout: 'statement', kicker: '一句话', title: '它会听，也会想', sub: '本地运行，不上传你说的任何一句话' },
          { layout: 'stat', kicker: '续航', title: '一次充电', stat: '36h', statLabel: '从早高峰用到第二天中午' },
          { layout: 'bullets', kicker: '新能力', title: '三个新能力', bullets: ['40 种语言实时同传', '会议自动生成纪要', '开车时只用声音回消息'] },
          { layout: 'stat', kicker: '价格', title: '首发价', stat: '¥1299', statLabel: '12 月 8 日 20:00 开售' },
          { layout: 'end', title: 'See you in orbit', sub: '预约通道现已开放' },
        ],
      },
    },
    {
      id: 'lesson', name: '课程讲义', theme: 'memphis',
      deck: {
        title: '光合作用 · 第 4 课',
        slides: [
          { layout: 'cover', kicker: '初二生物 · 第 4 课', title: '光合作用', sub: '15 分钟讲明白植物怎么“吃饭”', meta: '王老师的生物课' },
          { layout: 'bullets', kicker: '三要素', title: '你需要知道的', bullets: ['原料：二氧化碳 + 水', '能量：阳光', '产物：葡萄糖 + 氧气'] },
          { layout: 'stat', kicker: '划重点', title: '记住这个反应式', stat: '6CO₂+6H₂O', statLabel: '→ C₆H₁₂O₆ + 6O₂（光照、叶绿体）' },
          { layout: 'quote', quote: '叶子是植物的厨房，阳光是它的炉火。', author: '课堂比喻' },
          { layout: 'bullets', kicker: '动手', title: '课后小实验', bullets: ['把一盆绿萝放在暗处 3 天', '观察叶片颜色的变化', '写下你的猜想'] },
          { layout: 'end', title: '下课！', sub: '下节课：呼吸作用' },
        ],
      },
    },
    {
      id: 'book', name: '读书分享', theme: 'editorial',
      deck: {
        title: '《被讨厌的勇气》读书会',
        slides: [
          { layout: 'cover', kicker: '读书会 · 第 12 期', title: '《被讨厌的勇气》', sub: '我们为什么总在意别人的看法', meta: '主讲 · 小周' },
          { layout: 'quote', quote: '所谓的自由，就是被别人讨厌。', author: '岸见一郎、古贺史健' },
          { layout: 'bullets', kicker: '关键词', title: '书里的三个关键词', bullets: ['课题分离', '目的论', '共同体感觉'] },
          { layout: 'statement', kicker: '展开', title: '课题分离', sub: '分清哪些是我的事，哪些是别人的事' },
          { layout: 'bullets', kicker: '讨论', title: '聊聊你自己', bullets: ['你最近一次“在意别人的看法”是什么时候？', '有哪些事，其实不是你的课题？'] },
          { layout: 'end', title: '下期见', sub: '下期书目：《置身事内》' },
        ],
      },
    },
    {
      id: 'travel', name: '旅行回忆', theme: 'jelly',
      deck: {
        title: '京都七日',
        slides: [
          { layout: 'cover', kicker: 'Trip · 2026 秋', title: '京都七日', sub: '慢慢走，好好吃', meta: '和阿青一起' },
          { layout: 'stat', kicker: '数据', title: '这一周我们走了', stat: '86,400 步', statLabel: '平均每天一万两千步' },
          { layout: 'bullets', kicker: '吃', title: '必吃清单', bullets: ['锦市场的玉子烧', '鸭川边的抹茶冰', '深夜的拉面摊'] },
          { layout: 'quote', quote: '在哲学之道上，连发呆都很有道理。', author: '第 3 天日记' },
          { layout: 'bullets', kicker: '下次', title: '下次还想去', bullets: ['冬天的金阁寺', '奈良喂鹿', '岚山小火车'] },
          { layout: 'end', title: 'またね', sub: '下一站，北海道' },
        ],
      },
    },
    {
      id: 'brand', name: '品牌提案', theme: 'bauhaus',
      deck: {
        title: '山野咖啡品牌提案',
        slides: [
          { layout: 'cover', kicker: '品牌提案 · v2', title: '山野咖啡', sub: '把一杯咖啡，做成一次出门', meta: '视觉方向提案' },
          { layout: 'statement', kicker: '关键词', title: '户外 · 真实 · 有温度', sub: '品牌的三个关键词' },
          { layout: 'bullets', kicker: '视觉系统', title: '视觉系统', bullets: ['主色：日落橙 + 松林绿', '字体：粗衬线 + 手写标注', '图形：等高线与山形'] },
          { layout: 'stat', kicker: '目标', title: '2027 年底', stat: '120 家', statLabel: '门店，覆盖 18 个城市' },
          { layout: 'quote', quote: '咖啡是借口，出门才是目的。', author: '品牌主张' },
          { layout: 'end', title: '谢谢', sub: '期待一起把它做出来' },
        ],
      },
    },
    {
      id: 'tea', name: '活动邀请', theme: 'ink',
      deck: {
        title: '秋分雅集 · 一席茶',
        slides: [
          { layout: 'cover', kicker: '秋分 · 雅集', title: '一席茶', sub: '与三五好友，坐看秋色', meta: '九月廿三 · 西湖畔' },
          { layout: 'bullets', kicker: '流程', title: '雅集流程', bullets: ['申时 入席 · 焚香', '酉时 品茶 · 三道', '戌时 赏月 · 抚琴'] },
          { layout: 'quote', quote: '茶亦醉人何须酒，书能香我不须花。', author: '古语' },
          { layout: 'bullets', kicker: '茶单', title: '今日茶单', bullets: ['龙井 · 明前', '白毫银针', '老枞水仙'] },
          { layout: 'end', title: '恭候', sub: '请着素衣，静心而来' },
        ],
      },
    },
  ];

  // Curated remixes for the gallery wall: [template, slide index, theme, palette|null, background].
  P.GALLERY = [
    [
      ['pitch', 0, 'brutal', null, 'none'],
      ['annual', 0, 'swiss', 'klein', 'none'],
      ['launch', 0, 'neon', null, 'none'],
      ['lesson', 0, 'memphis', 'sakura', 'dots'],
      ['book', 0, 'editorial', 'kraft', 'grain'],
      ['travel', 0, 'jelly', null, 'none'],
      ['brand', 0, 'bauhaus', 'tomato', 'none'],
      ['tea', 0, 'ink', null, 'grain'],
      ['launch', 0, 'neon', 'sunset', 'none'],
      ['pitch', 0, 'bauhaus', 'mint', 'none'],
    ],
    [
      ['annual', 1, 'swiss', null, 'none'],
      ['travel', 1, 'jelly', 'sakura', 'mesh'],
      ['book', 1, 'editorial', null, 'none'],
      ['pitch', 2, 'brutal', null, 'none'],
      ['lesson', 2, 'memphis', 'lemon', 'grid'],
      ['tea', 2, 'ink', null, 'none'],
      ['launch', 4, 'neon', 'cyber', 'none'],
      ['brand', 4, 'bauhaus', 'forest', 'none'],
      ['annual', 4, 'editorial', 'blackgold', 'none'],
      ['travel', 2, 'memphis', 'dopamine', 'confetti'],
    ],
  ];
})(window.PLAY);
