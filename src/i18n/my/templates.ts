// Burmese for the function-valued strings (templates with numbers), keyed like the JSON overlays: '<dir>.<base>.<EXPORT>'
// (or 'core') -> dotted key -> function with the same arguments as the English one. Until the overlay reads this file,
// these strings stay English on the page. templates.test.ts checks each one against its English twin.
type Tpl = (...a: never[]) => string

export const MY_TEMPLATES: Record<string, Record<string, Tpl>> = {
  core: {
    'wv.jump': (m: number) => `jump > ${m} m`,
    'wv.obstacles': (n: number) => `အတားအဆီး ${n} ခု`,
    'wv.cells': (m: number) => `${m} m cell တွေ`,
    'grid.limit': (slam: number, sensor: number) =>
      `SLAM က beam တွေကို ${slam} m (max_laser_range) အထိ သုံးနိုင်ပေမဲ့ LiDAR က ${sensor} m ကျော်ရင် ဘာမှ ပြန်မပေးပါဘူး- ကန့်သတ်ချက်ကို ဆင်ဆာက သတ်မှတ်ပါတယ်။`,
  },
  'ep.bfs.BFS_STRINGS': {
    caption: (k: number, n: number, q: number) => `အဆင့် ${n} ခုထဲက ${k} · queue ထဲမှာ ${q} ခု`,
    cellLabel: (x: number, y: number, wall: boolean) => `cell ${x},${y}${wall ? '၊ နံရံ' : ''}`,
  },
  'ep.late.LATE_STRINGS': {
    goalText: (acted: number, back: number) => `သုံးခဲ့တာ ${acted}၊ အတိတ်ကို ပြန်သွားတာ ${back}×`,
    caption: (n: number, t: string) => `t = ${t} s · 20 ခုထဲက ${n} ခု ရောက်ပြီ`,
  },
  'l0.act.ACT_STRINGS': {
    brokenNote: (cm: number, s: number) => `ရပ်ဖို့ ပြောတဲ့အခါ စက်ရုပ်က ခွင့်ပြုထားသလောက် အပြင်းဆုံး ဘရိတ်အုပ်ပေမဲ့ ${s} s အတွင်း ${cm} cm ဆက်လိမ့်သွားပါတယ်။`,
  },
  'l0.loop.LOOP_STRINGS': {
    caption: (n: number, stage: string) => `loop ${n} · ${stage}`,
    thinkLine: (d: number, go: boolean) => `${d} m < 0.5 m? ${go ? 'မဟုတ် → သွား' : 'ဟုတ် → ရပ်'}`,
    actGo: (cm: number) => `${cm} cm သွား`,
  },
  'l0.move.MOVE_STRINGS': { caption: (s: number) => `${s} s` },
  'l0.pipe.PIPE_STRINGS': { caption: (name: string) => `scan ရောက်နေတဲ့နေရာ: ${name}` },
  'l0.ros.ROS_STRINGS': {
    caption: (date: string, n: number, total: number) => `${date}: ပြထားတဲ့ ${total} ခုထဲက ${n} ခု ပြင်ဆင်ချက် ရနေဆဲ`,
    brokenNote: (n: number) =>
      `Iron က Dec 4, 2024 မှာ ပြင်ဆင်ချက် ရပ်သွားပါပြီ။ အဲဒီပေါ်မှာ စခဲ့တဲ့ project က လုံခြုံရေး ဒါမှမဟုတ် bug ပြင်ဆင်ချက် မပါဘဲ ${n} လ ကြာသွားပါပြီ။ LTS ကို ရွေးပါ။`,
  },
  'l0.scope.SCOPE_STRINGS': {
    level: (r: string) => (r === 'EP' ? 'EP' : `Level ${r}`),
    caption: (n: number, total: number) => `အတန်း ${total} ခုထဲက ${n} ခု ပြထား`,
    brokenNote: (n: number, names: string) => `C++ ကို ကျော်ရင် အခန်း ${n} ခု ပိတ်သွားပါတယ်: ${names}။ အဲဒီ အခန်း အများစုအတွက် C++ ဖတ်တတ်ရုံနဲ့ လုံလောက်ပါတယ်။`,
    solved: (name: string, n: number, total: number) => `မှန်ပါတယ်: ${name}၊ အခန်း ${total} ခုထဲက ${n} ခုမှာ။`,
    wrong: (name: string, n: number) => `${name} က အခန်း ${n} ခုမှာ ပါပါတယ်။ ကော်လံ တစ်ခုချင်းစီက အစက်တွေကို ပြန်ရေကြည့်ပါ။`,
  },
  'l0.think.THINK_STRINGS': {
    'fig.distance': (d: number) => `နံရံ ${d} m အကွာ`,
    caption: (n: number, d: number, go: boolean) => `စစ်ချက် ${n}: ${d} m → ${go ? 'သွား' : 'ရပ်'}`,
  },
  'l0.tools.TOOLS_STRINGS': {
    caption: (name: string) => `အလွှာ: ${name}`,
    breakIt: (name: string) => `ဖျက်ကြည့်: ${name} ကို ဖယ်`,
    brokenNote: (n: number) =>
      `မီးခိုးရောင် = အလုပ်မလုပ်တော့ဘူး။ အလွှာ 5 ခုထဲက ${n} ခု အလုပ်လုပ်နေဆဲပါ။ ros2 command ကိုယ်တိုင်က Python ပရိုဂရမ် ဖြစ်လို့ Python မရှိရင် ROS 2 ပါ ပြိုကျပါတယ်။`,
    notYet: (n: number) => `မရသေးပါ: 4 ခုထဲက ${n} ခု မှန်ပါတယ်။`,
  },
  'l1.callback.CALLBACK_STRINGS': {
    measured: (drop: number, age: number, env: string) =>
      `တကယ့် ROS (${env}) ပေါ်မှာ တူညီတဲ့ စမ်းသပ်မှု၊ callback 600 ms: scan ${drop} ခု ပစ်ခဲ့ပြီး သုံးခဲ့တဲ့ အဟောင်းဆုံး data က ${age} s ပါ။`,
    caption: (t: string, n: number, w: number) => `t = ${t} s · on_scan ကို ${n}× ခေါ်ပြီး · ${w} ခု စောင့်နေ`,
  },
  'l1.closest.CLOSEST_STRINGS': {
    caption: (i: number, d: number, c: number, up: boolean) => `အကြိမ် ${i + 1}/10 · d = ${d} m ${up ? '<' : '≥'} closest → closest = ${c}`,
    ret: (c: number) => `return ${c}`,
  },
  'l1.cpp.CPP_STRINGS': {
    benchNote: (py: string, c: string) =>
      `လက်ပ်တော့ တစ်လုံးပေါ်မှာ တိုင်းထားတာ၊ 3 ကြိမ် run ထဲက အကောင်းဆုံး: Python ${py}၊ ${c}။ ပြန် run ဖို့: src/chapters/l1/bench/run.sh။`,
  },
  'l1.decide.DECIDE_STRINGS': { caption: (k: number, d: number, dec: string) => `scan ${k} · အကွာအဝေး = ${d} m → ${dec}` },
  'l1.intro.INTRO1_STRINGS': { caption: (k: number) => `အဆင့် 5 ခုထဲက ${k}` },
  'l2.actions.ACTIONS_STRINGS': { caption: (t: string, last: string) => `t = ${t} s · ${last}` },
  'l2.drive.DRIVE_STRINGS': { caption: (t: string, v: number) => `t = ${t} s · အမြန်နှုန်း ${v} m/s` },
  'l2.intro.INTRO2_STRINGS': { caption: (k: number, n: number) => `အဆင့် 7 ခုထဲက ${k} · node 7 ခုထဲက ${n} ခု အလုပ်လုပ်နေ` },
  'l2.msgtypes.MSGTYPES_STRINGS': {
    ignoredNote: (f: string) => `စက်ရုပ်က လျစ်လျူရှုတာ: ${f}။ message က မှန်ပါတယ်၊ စက်ရုပ်က အဲဒီ field ကို ဘယ်တော့မှ မဖတ်ရုံပါပဲ။`,
    caption: (n: number, b: number) => (b ? `ranges: beam 360 ခုထဲက ${b} ခု ဆွဲထား` : `field 10 ခုထဲက ${n}`),
  },
  'l2.nodes.NODES_STRINGS': { caption: (t: string, n: number) => `t = ${t} s · node 7 ခုထဲက ${n} ခု အလုပ်လုပ်နေ` },
  'l2.params.PARAMS_STRINGS': { caption: (n: number, w: number) => `စစ်ချက် ${n}/20 · သတိပေးချက် ${w} ခု` },
  'l2.topics.TOPICS_STRINGS': {
    cliNote: (m: number) => `ဒီ repo ကိုယ်တိုင် run တဲ့အခါ ros2 topic hz /scan က ${m} Hz တိုင်းမိပါတယ်၊ config မှာ 5 Hz ထားပါတယ်။`,
    caption: (t: string, n: number) => `t = ${t} s · ကြိုးတွေပေါ်မှာ message ${n} ခု`,
  },
}
