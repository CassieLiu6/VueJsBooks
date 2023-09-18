// 作用是存储被注册的副作用函数
let activeEffect;

function effect(fn) {
  activeEffect = fn;
  fn();
}

// 原始数据
const data = { text: 'hello world' };
const bucket = new WeakMap();

function track(target, key) {
  // 没有 activeEffect， 直接返回
  if (!activeEffect) return target[key];
  // 根据 target 从“桶”中取得 depsMap,它也是一个 Map 类型 key---> effects
  let depsMap = bucket.get(target);
  // 如果不存在， 那么新建一个 Map，并与 target 关联
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  // 再根据 key 从 depsMap 中取得 deps, 它是一个 Set 类型
  // 里面存储这所有与当前 key 相关联的副作用函数:effects
  let deps = depsMap.get(key);
  // 如果 deps 不存在， 同样新建一个 Set 并于 key 关联
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  // 最后将当前激活的副作用函数存储到 “桶” 中
  deps.add(activeEffect);
}

function trigger(target, key) {
  // 根据 target 从桶中取得 depsMap， 他是 key----effects
  const depsMap = bucket.get(target);
  // 如果 depsMap 不存在， 那么直接返回
  if (!depsMap) return;
  // 根据 key 获取所有副作用函数的 effects
  const effects = depsMap.get(key);
  // 执行副作用函数
  effects && effects.forEach(fn => fn());
}

const obj = new Proxy(data, {
  get(target, key) {
    // 没有 activeEffect， 直接返回
    track(target, key);
    return target[key];
  },
  set(target, key, newValue) {
    // 设置属性值
    target[key] = newValue;
    trigger(target, key);
  }
})