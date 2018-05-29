/* eslint-disable */
import { camelize } from './uitls'

/**
 * 分离出事件个props,主要是因为传入creatApi的config是一个对象，混合进事件和props了
 * @param {*} data 
 * @param {*} events 
 */
export default function parseRenderData(data = {}, events = {}) {
  events = parseEvents(events)
  const props = { ...data }
  const on = {}
  for (const name in events) {
    if (events.hasOwnProperty(name)) {
      const handlerName = events[name]
      if (props[handlerName]) {
        on[name] = props[handlerName] // 把props中的事件转移到on下面
        delete props[handlerName]
      }
    }
  }
  return {
    props,
    on
  }
}
// 解析事件名字，会匹配到传入的参数onAbc
function parseEvents(events) {
  const parsedEvents = {}
  events.forEach((name) => {
    parsedEvents[name] = camelize(`on-${name}`)
  })
  return parsedEvents
}
