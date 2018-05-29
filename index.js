import createAPIComponent from './create-api-component'
import { processComponentName } from './uitls'

export default function createAPI (Vue, Component, events, single) {
  console.log(this)
  // 生成实例
  const api = createAPIComponent.apply(this, arguments)
  // 处理组件名字
  const createName = processComponentName(Component, {
    prefix: '$create-'
  })
  // 注入vue原型链
  Vue.prototype[createName] = api.create
  Component.$create = api.create
  return api
}
