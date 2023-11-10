let activeEffect;
let effectStack = [];

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn;
    effectStack.push(effectFn);
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  }
  effectFn.options = options;
  effectFn.deps = []
  if (!options.lazy) {
    effectFn();
  }
  return effectFn;
}

function cleanup(effectFn) {
  effectFn.deps.forEach(dep => dep.delete(effectFn));
  effectFn.deps.length = 0;
}

function track(target, key) {
  if (!activeEffect) return target[key];
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  const effectsToRun = new Set();
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn);
    }
  })
  effectsToRun && effectsToRun.forEach(effectFn => {
    if (effectFn.options?.scheduler) {
      effectFn.options?.scheduler(effectFn);
    } else {
      effectFn()
    }
  })
}

function computed(getter) {
  let value;
  let dirty = true;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      console.log("======");
      if (!dirty) {
        dirty = true;
        trigger(obj, 'value')
      }
    }
  });
  const obj = {
    get value() {
      // if (dirty) {
      //   value = effectFn();
      //   dirty = false;
      //   track(obj, 'value');
      // }
      value = effectFn();
      return value;
    }
  }
  return obj;
}


const data = { foo: 2, bar: 4 };
const bucket = new WeakMap();

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key);
    return target[key]
  },
  set(target, key, value) {
    target[key] = value;
    trigger(target, key);
  }
})

// 需要实现调用 obj.foo 的时候， 执行别的操作， 比如打印
// effect(() => {
//   console.log('effect1', obj.foo);
// }, {
//   scheduler(fn) {
//     console.log("======");
//     setTimeout(fn);
//   }
// })

// obj.foo++;
// console.log("结束了🔚")
// console.log(obj.foo)

const jobQueue = new Set();
const p = Promise.resolve();
let isFlushing = false;
const flushJob = () => {
  if (isFlushing) return;
  isFlushing = true;
  p.then(() => {
    jobQueue.forEach(job => job());
  }).finally(() => {
    isFlushing = false;
  })
}

// effect(() => {
//   console.log(obj.foo);
// }, {
//   scheduler(fn) {
//     jobQueue.add(fn);
//     flushJob();
//   }
// })

// obj.foo++;
// obj.foo++;

// console.log('结束了🔚');


const sumRes = computed(() => obj.foo + obj.bar);
// console.log(sumRes.value);
// obj.foo++;
// console.log(obj)
// console.log(sumRes.value);
effect(() => {
  console.log(sumRes.value);
})
obj.foo++;
console.log(sumRes.value);
