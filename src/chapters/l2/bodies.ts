import { CallbackChapter, ClosestChapter, CppChapter, DecideChapter, ShellChapter } from '../l1'
import Intro1 from '../l1/Intro'
import Intro2 from './Intro'
import { ActionsChapter, DriveChapter, MsgTypesChapter, NodesChapter, ParamsChapter, TopicsChapter, WsChapter } from '.'

/** Level 1-2 chapter bodies by route id (props { t: Strings }). The dev preview and index.test use this map. */
export const BODIES = {
  decide: DecideChapter, closest: ClosestChapter, callback: CallbackChapter, cpp: CppChapter, shell: ShellChapter,
  nodes: NodesChapter, topics: TopicsChapter, msgtypes: MsgTypesChapter, actions: ActionsChapter, params: ParamsChapter, ws: WsChapter, drive: DriveChapter,
}

/** Level intro pages by level number: shown at #/1 and #/2 before the chapter list (lead wires the route). */
export const INTROS = { 1: Intro1, 2: Intro2 }
