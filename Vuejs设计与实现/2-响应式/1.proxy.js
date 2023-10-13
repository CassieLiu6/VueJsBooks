/**
  * 响应式数据的基本实现
  * 1. 把副作用函数存储到桶中
  * 2. 把副作用函数从“桶”内取并执行
 */


// 存储副作用函数的桶
const bucket = new Set();

// 原始数据
const data = { text: 'hello world' };

function effect() {
  document.body.innerText = obj.text;
}

// 对原始数据的代理
const obj = new Proxy(data, {
  get(target, key) {
    // 读取数据时，把副作用函数存储到桶中
    bucket.add(effect);
    return target[key];
  },
  set(target, key, value) {
    // 设置属性值
    target[key] = value;
    // 写入数据时，把桶中的副作用函数全部执行一遍
    bucket.forEach(effect => effect());
    // 返回 true， 代表设置操作成功
    return true;
  },
})

effect();

setTimeout(() => {
  obj.text = "hello vue3";
  console.log(obj);
}, 1000);
