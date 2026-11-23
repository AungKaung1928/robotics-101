import { describe, expect, it } from 'vitest'
import { encodingErrors, lint } from './my-lint.mjs'

describe('Burmese encoding check', () => {
  // Zawgyi spellings (visual order, Zawgyi-only code points); each must fail.
  const zawgyi = {
    'Maung (ေ first)': 'ေမာင္',
    'Myanmar (ျ first, ္ as asat)': 'ျမန္မာ',
    'I (ၽ U+107D)': 'ကၽြန္ေတာ္',
    'school (ေ first)': 'ေက်ာင္း',
    'stacked ka U+1060': 'မၠာ',
  }
  for (const [name, s] of Object.entries(zawgyi)) it(`rejects Zawgyi: ${name}`, () => expect(encodingErrors(s)).not.toEqual([]))

  it('rejects letters from other scripts', () => {
    for (const s of ['ยัง MISSING ဖြစ်နေတုန်းပါပဲ', 'ロボット ကို ရပ်ပါ။', '机器人', 'робот']) expect(encodingErrors(s), s).not.toEqual([])
    expect(encodingErrors('θ = 0.5 rad, LiDAR → ကြည့်ပါ။')).toEqual([])
  })
  it('accepts Unicode Burmese', () => {
    for (const s of ['မောင်', 'မြန်မာ', 'ကျွန်တော်', 'ကျောင်း', 'မန္တလေး', 'စင်္ကာပူ', 'စက်ရုပ်ကို ရပ်ပါ။']) expect(encodingErrors(s), s).toEqual([])
  })
})

describe('lint', () => {
  it('rejects literary forms in labels too, and the attributive သည့် (pinned UI verbs excepted)', () => {
    expect(lint('Bring-up order', 'စက်နှိုးသည့် အစီအစဉ်', 'label').fail.join()).toMatch(/literary/)
    expect(lint('beams with a return', 'ပြန်လာသော beam တွေ', 'label').fail.join()).toMatch(/literary/)
    expect(lint('Back', 'နောက်သို့', 'label').fail).toEqual([])
  })
  it('does not read a glossary word inside an identifier (sensor_msgs is not "sensor")', () => {
    expect(lint('the data shape, like sensor_msgs/msg/LaserScan', 'ဒေတာ ပုံစံ၊ ဥပမာ sensor_msgs/msg/LaserScan', 'label').fail).toEqual([])
    expect(lint('a sensor', 'sensor တစ်ခု', 'label').fail.join()).toMatch(/sensor/)
  })
  it('allows ordinary words that only contain a literary ending (guest, trader)', () => {
    expect(lint('Guests wait.', 'ဧည့်သည်တွေ စောင့်ပါတယ်။', 'body').fail).toEqual([])
    expect(lint('Traders wait.', 'ကုန်သည်တွေ စောင့်ပါတယ်။', 'body').fail).toEqual([])
    expect(lint('It stops.', 'ရပ်သည်။', 'body').fail.join()).toMatch(/literary/)
  })
  it('counts English number words as digits, like the parity test (one is free)', () => {
    expect(lint('two wheels', 'ဘီး နှစ်ဘီး', 'label').fail.join()).toMatch(/numbers/)
    expect(lint('two wheels', 'ဘီး 2 ဘီး', 'label').fail).toEqual([])
    expect(lint('one wheel', 'ဘီး တစ်ဘီး', 'label').fail).toEqual([])
  })
  it('passes a correct body sentence', () => {
    const en = 'Each beam returns the nearest wall or obstacle, if it is closer than 3.5 m.'
    const my = 'beam တစ်ခုစီက 3.5 m ထက် နီးတဲ့ အနီးဆုံး နံရံ ဒါမှမဟုတ် အတားအဆီးကို ပြန်ပြပါတယ်။'
    expect(lint(en, my)).toEqual({ fail: [], warn: [] })
  })
  it('fails changed numbers, lost identifiers, literary endings, missing ။', () => {
    const en = 'Publish to /cmd_vel at 10 Hz.'
    expect(lint(en, '/cmd_vel ကို 5 Hz နဲ့ ပို့ပါ။').fail.join()).toMatch(/numbers/)
    expect(lint(en, 'cmd_vel ကို 10 Hz နဲ့ ပို့ပါ။').fail.join()).toMatch(/identifier \/cmd_vel/)
    expect(lint(en, '/cmd_vel ကို 10 Hz ဖြင့် ပို့သည်။').fail.join()).toMatch(/literary/)
    expect(lint(en, '/cmd_vel ကို 10 Hz နဲ့ ပို့ပါ').fail.join()).toMatch(/။/)
  })
  it('accepts number words written as digits, rejects sentence endings on labels', () => {
    expect(lint('One LiDAR scan', 'LiDAR scan 1 ကြိမ်', 'label').fail).toEqual([])
    expect(lint('One LiDAR scan', 'LiDAR scan 2 ကြိမ်', 'label').fail.join()).toMatch(/numbers/)
    expect(lint('moved per scan at 0.26 m/s', '0.26 m/s နဲ့ scan တစ်ကြိမ်မှာ ရွှေ့တဲ့ အကွာအဝေး ဖြစ်ပါတယ်။', 'label').fail.join()).toMatch(/sentence ending/)
  })
  it('pins UI verbs, loanwords and tier A terms', () => {
    expect(lint('Pause', 'ရပ်', 'label').fail.join()).toMatch(/UI verb/)
    expect(lint('Pause', 'ခဏရပ်', 'label').fail).toEqual([])
    expect(lint('Stop the robot.', 'ရိုဘော့ကို ရပ်ပါ။').fail.join()).toMatch(/robot/)
    expect(lint('Start one node.', 'နုတ် တစ်ခု စပါ။').fail.join()).toMatch(/tier A "node"/)
  })
})
