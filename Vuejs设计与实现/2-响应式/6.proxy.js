// 用一个全局变量存储被注册的副作用函数
let activeEffect
const effectStack = [];

function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    // 当 effectFn 执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn
    // 在调用副作用函数之前将当前副作用函数压入栈中
    effectStack.push(effectFn);
    fn();
    // 在当前副作用函数执行完毕后， 将当前副作用函数弹出去 并把activeEffect还原之前的值
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  }
  // activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = [];
  effectFn();
}

function cleanup(effectFn) {
  effectFn.deps.forEach(dep => {
    // 将 effectFn 从依赖集合中移除
    dep.delete(effectFn);
  })
  effectFn.deps.length = 0;
}

// 原始数据
const data = { text: 'hello world', ok: true, foo: true, bar: true };
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
  // 将其添加到 activeEffect.deps 数组中
  activeEffect.deps.push(deps);// 新增
}

function trigger(target, key) {
  // 根据 target 从桶中取得 depsMap， 他是 key----effects
  const depsMap = bucket.get(target);
  // 如果 depsMap 不存在， 那么直接返回
  if (!depsMap) return;
  // 根据 key 获取所有副作用函数的 effects
  const effects = depsMap.get(key);
  const effectsToRun = new Set() // 新增
  // 执行副作用函数
  effects && effects.forEach(effectFn => {
    // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn);
    }
    effectFn()
  });
  effectsToRun && effectsToRun.forEach(effectFn => effectFn());
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

let temp1, temp2;
effect(function effectFn1() {
  console.log('effectFn1 执行');
  effect(function effectFn2() {
    console.log("effectFn2 执行");
    temp2 = obj.bar;
  });
  temp1 = obj.foo;
})

setTimeout(() => {
  obj.foo = false;
}, 1000);