

// 作用是存储被注册的副作用函数
let activeEffect;

function effect(fn) {
  activeEffect = fn;
  fn();
}


// 原始数据
const data = { text: 'hello world' };
// 存储副作用函数的桶
const bucket = new Set();
const obj = new Proxy(data, {
  get(target, key) {
    if (activeEffect) {
      bucket.add(activeEffect);
    }
    return target[key];
  },

  set(target, key, value) {
    target[key] = value;
    bucket.forEach(fn => fn());
    return true;
  }
})


effect(() => {
  console.log('effect run');
  document.body.innerHTML = obj.text
});


setTimeout(() => {
  obj.notExist = 'hello vue3'
}, 1000);