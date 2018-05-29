/* eslint-disable */
import instantiateComponent from './instantiate-component'
import parseRenderData from './parse-render-data'

export default function createAPIComponent(Vue, Component, events = [], single = false) {
  let singleComponent // 单例组件
  let singleInstance // 单例实例
  const beforeFns = [] // ？？？
  // 最后会直接返回这个api对象
  const api = {
    /**
     * ???
     * @param {*} fn 
     */
    before(fn) {
      beforeFns.push(fn)
    },
    /**
     * 生成一个组件，就是$createAbBb()
     * @param {*} data 
     * @param {*} renderFn 
     * @param {*} options 
     */
    open(data, renderFn, options) {
      // 。。。这里options不可能为undefined啊。。。
      if (typeof renderFn !== 'function' && options === undefined) {
        options = renderFn
        renderFn = null
      }
      let instanceSingle = options // 是否是单例模式
      if (typeof options === 'object') {
        instanceSingle = options.single
        delete options.single
      }

      beforeFns.forEach((before) => {
        before(data, renderFn, instanceSingle)
      })
      // 意思是如果$createAaBa()不传sigle的花，会取reateApi()的sigle, 默认为false
      if (instanceSingle === undefined) {
        instanceSingle = single
      }
      // 是单例模式且已经生成过一个单例了
      if (instanceSingle && singleComponent) {
        // 重新设置组建的 renderData 和渲染函数
        singleInstance.updateRenderData(data, renderFn)
        // visibility mixin watch visible should not hide
        singleComponent._createAPI_reuse = true
        // 重渲染
        singleInstance.$forceUpdate()
        // 存在visible的话就会在下一个事件循环执行组件的show方法
        const oldVisible = singleComponent.visible
        singleComponent.$nextTick(() => {
          singleComponent._createAPI_reuse = false
          // prop visible true -> to
          if (oldVisible && singleComponent.visible) {
            singleComponent.show()
          }
        })
        // singleComponent.show && singleComponent.show()
        return singleComponent
      }
      // 开始去实例化组价了
      const component = instantiateComponent(Vue, Component, data, renderFn, options)
      const instance = component.$parent
      const originRemove = component.remove

      // 设置摧毁函数
      component.remove = function () {
        if (instance.__cube__destroyed) {
          return
        }
        originRemove && originRemove.call(this)
        instance.destroy()
        instance.__cube__destroyed = true
        if (instanceSingle) {
          singleComponent = null
          singleInstance = null
        }
      }
      const originShow = component.show
      component.show = function () { // 重写show方法
        originShow && originShow.call(this)
        return this
      }
      const originHide = component.hide
      component.hide = function () {
        originHide && originHide.call(this)
        return this
      }
      if (instanceSingle) {
        singleComponent = component
        singleInstance = instance
      }
      // component.show && component.show()
      return component
    },
    /**
     * 生成实例
     * @param {Object={}} config 配置参数，经处理后传给组件
     * @param {Function} renderFn 可选参数，用于生成子 VNode 节点，一般场景是处理 slot
     * @param {Boolean} single 可选参数，创建的时候决定是否是单例的，优先级更高，如果没有传入 renderFn 的话，single 的值就是第二个参数的值;默认采用createApi的第四个参数single
     */
    create(config, renderFn, single) {
       // 指向条用createAaBa()的vue组件
      const ownerInstance = this
       // 检测是否是vue组件
      const isInVueInstance = !!ownerInstance.$on
      // 解析传入的config和event,分离props和事件
      const renderData = parseRenderData(config, events)

      cancelWatchProps()
      processProps()
      processEvents()

      if (typeof renderFn !== 'function' && single === undefined) {
        single = renderFn
        renderFn = null
      }
      // to get Vue options
      // store router i18n ...
      const options = {
        single: single
      }
      if (isInVueInstance) {
        options.parent = ownerInstance
      }

      const component = api.open(renderData, renderFn, options)
      // 移除组件，当父组件销毁时
      if (component.__cube__parent !== ownerInstance) {
        component.__cube__parent = ownerInstance
        const beforeDestroy = function () {
          cancelWatchProps()
          if (component.__cube__parent === ownerInstance) {
            // 移除，会vm.destroy()和document.body.removeChild(this.$el)
            component.remove()
          }
          ownerInstance.$off('hook:beforeDestroy', beforeDestroy)
          component.__cube__parent = null
        }
        isInVueInstance && ownerInstance.$on('hook:beforeDestroy', beforeDestroy)
      }
      return component
      // 处理props
      function processProps() {
        const $props = renderData.props.$props
        console.log(renderData.props)
        if ($props) {
          delete renderData.props.$props

          const watchKeys = []
          const watchPropKeys = []
          Object.keys($props).forEach((key) => {
            const propKey = $props[key]
            if (typeof propKey === 'string' && propKey in ownerInstance) {
              // get instance value
              renderData.props[key] = ownerInstance[propKey]
              watchKeys.push(key)
              watchPropKeys.push(propKey)
            } else {
              renderData.props[key] = propKey
            }
          })
          if (isInVueInstance) {
            // 监听props
            ownerInstance.__createAPI_watcher = ownerInstance.$watch(function () {
              const props = {}
              // 监听父组件的属性变化而更新create的组件
              watchKeys.forEach((key, i) => {
                props[key] = ownerInstance[watchPropKeys[i]]
              })
              return props
            }, function (newProps) {
              // 更新 刷新组件
              component && component.$updateProps(newProps)
            })
          }
        }
      }
      // 处理事件
      function processEvents() {
        const $events = renderData.props.$events
        if ($events) {
          delete renderData.props.$events

          Object.keys($events).forEach((event) => {
            let eventHandler = $events[event]
            if (typeof eventHandler === 'string') {
              eventHandler = ownerInstance[eventHandler]
            }
            renderData.on[event] = eventHandler
          })
        }
      }
      // 取消监听props
      function cancelWatchProps() {
        if (ownerInstance.__createAPI_watcher) {
          ownerInstance.__createAPI_watcher()
          ownerInstance.__createAPI_watcher = null
        }
      }
    }
  }
  return api
}
