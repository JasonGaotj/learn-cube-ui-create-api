/* eslint-disable */
/**
 * 
 * @param {Vue} Vue 
 * @param {VueComponent} Component 
 * @param {object} data 
 * @param {function} renderFn 
 * @param {option} options 
 */
export default function instantiateComponent(Vue, Component, data, renderFn, options) {
  console.log(renderData)
  let renderData // 渲染函数的render option
  let childrenRenderFn // 渲染方法

  if (options === undefined) {
    options = {}
  }

  const instance = new Vue({
    ...options,
    render(createElement) {
      let children = childrenRenderFn && childrenRenderFn(createElement)
      if (children && !Array.isArray(children)) {
        children = [children]
      }

      // {...renderData}: fix #128, caused by vue modified the parameter in the version of 2.5.14+, which related to vue issue #7294.
      return createElement(Component, {...renderData}, children || [])
    },
    methods: {
      init() {
        document.body.appendChild(this.$el)
      },
      destroy() {
        this.$destroy()
        document.body.removeChild(this.$el)
      }
    }
  })
  instance.updateRenderData = function (data, render) {
    renderData = data
    childrenRenderFn = render
  }
  instance.updateRenderData(data, renderFn)
  // 生成挂载节点,实例就回出现属性 $el
  instance.$mount()
  // 挂载到body
  instance.init()
  const component = instance.$children[0]
  // 接收新的props来更新实例组件，在父组件更新了相关props的时候使用
  component.$updateProps = function (props) {
    Object.assign(renderData.props, props)
    instance.$forceUpdate()  // 重新渲染
  }
  return component
}
