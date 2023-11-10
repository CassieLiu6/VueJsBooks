let activeEffect;
const effectStack = [];
const bucket = new WeakMap();
let isFlushing = false;
let p = Promise.resolve();
const jobQueue = new Set();

function effect(fn, options = {}) {
  const effectFn = () => {
    activeEffect = effectFn;
    effectStack.push(effectFn);
    let res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  }
  effectFn.options = options;
  effectFn.deps = [];
  if (!options.lazy) {
    effectFn();
  }
  return effectFn;
}

function cleanup(effectFn) {
  effectFn.deps.forEach(dep => {
    dep.delete(effectFn);
  })
  effectFn.deps.length = 0;
}

function track(target, key) {
  if (!activeEffect) return target[key];
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  const effectToRun = new Set();
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectToRun.add(effectFn);
    }
  })
  effectToRun.forEach(effect => {
    if (effect.options?.schedular) {
      effect.options.schedular();
    }
    effect();
  })
}

function flushJob() {
  if (isFlushing) return;
  isFlushing = true;
  p.then(() => {
    jobQueue.forEach(job => job())
  }).finally(() => {
    isFlushing = false;
  })
}


function computed(getter) {
  let value;
  let dirty = true;
  const effectFn = effect(getter, {
    lazy: true,
    schedular() {
      if (!dirty) {
        dirty = true;
        trigger(obj, 'value');
      }
    }
  });
  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
        track(obj, 'value')
      }
      return value;
    }
  }
  return obj;
}

function traverse(value, seen = new Set()) {
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  seen.add(value);
  for (const k in value) {
    traverse(value[k], seen)
  }
  return value;
}


function watch(source, cb, options = {}) {
  let getter;
  if (typeof source === 'function') {
    getter = source;
  } else {
    getter = traverse(source);
  }
  let newValue, oldValue;
  const job = () => {
    newValue = effectFn();
    cb(newValue, oldValue);
    oldValue = newValue;
  }
  const effectFn = effect(() => getter(), {
    lazy: true,
    schedular() {
      if (options.flush === 'flush') {
        const p = Promise.resolve();
        p.then(job);
      } else {
        job();
      }
    }
  })
  if (options.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }

}

const data = { foo: 2, bar: 4 }
const obj = new Proxy(data, {
  get(target, key) {
    track(target, key);
    return target[key];
  },
  set(target, key, value) {
    target[key] = value;
    trigger(target, key)
  }
})

watch(() => obj.foo + obj.bar, (newValue, oldValue) => {
  console.log(newValue, oldValue)
})
obj.foo++;
obj.foo++;