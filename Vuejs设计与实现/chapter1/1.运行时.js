
function Render(obj, root) {
  const el = document.createElement(obj.tag)
  if (typeof obj.children === 'string') {
    const text = document.createTextNode(obj.children)
    el.appendChild(text)
  } else if (obj.children) {
    // 数组， 地柜调用 Render， 使用 el 作为 root 参数
    obj.children.forEach(item => Render(item, el))
  } else if (typeof obj === 'string') {
    const text = document.createTextNode(obj)
    el.appendChild(text)
  }
  root.appendChild(el)
}