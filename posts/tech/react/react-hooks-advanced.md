# React Hooks 高级用法与最佳实践

Hooks 是 React 16.8 引入的重大更新，它让函数组件拥有了类组件的能力。

## useReducer 的高级用法

对于复杂的状态逻辑，`useReducer` 比 `useState` 更加可控：

```javascript
const reducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, { count: 0 });
```

## 自定义 Hooks

自定义 Hook 是复用状态逻辑的主要方式：

```javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

## useCallback 与 useMemo

性能优化的关键：

- `useMemo`：缓存计算结果
- `useCallback`：缓存函数引用

```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

## useEffect 清理机制

正确处理副作用清理：

```javascript
useEffect(() => {
  const subscription = api.subscribe(data);
  
  return () => {
    // 清理工作
    subscription.unsubscribe();
  };
}, []);
```
