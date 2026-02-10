# Redux Best Practices для GoJS

## ⚠️ ВАЖНО: Роль Redux в GoJS приложении

**Redux используется ТОЛЬКО для синхронизации состояния**, а НЕ для изменения диаграммы!

✅ **Правильный подход:**
- Все изменения диаграммы → через **GoJS API** (`diagram.model.setDataProperty`, `startTransaction`, etc.)
- GoJS автоматически вызывает `onModelChange`
- `onModelChange` синхронизирует изменения в Redux
- Redux используется для persistence, export, display в UI

❌ **Неправильный подход:**
- НЕ делайте изменения через `dispatch(insertNode(...))` и `setSkips(false)`
- Это создает ненужную сложность и дополнительные циклы обновлений

**Примеры правильного подхода смотрите в:**
- `src/hooks/edge/useEdgeOperations.ts` - изменение свойств ребер
- `src/utils/diagram-access.ts` - утилиты для доступа к диаграмме

---

## 🎯 Основные принципы (согласно официальной документации GoJS)

### 1. **Двусторонняя синхронизация с `skipsDiagramUpdate`**

GoJS diagram и Redux state должны быть синхронизированы в обе стороны:
- **GoJS → Redux**: изменения в диаграмме автоматически попадают в Redux
- **Redux → GoJS**: изменения из кода React попадают в диаграмму

**Критический флаг**: `skipsDiagramUpdate` предотвращает циклические обновления.

```typescript
// ✅ ПРАВИЛЬНО: Используется skipsDiagramUpdate
<ReactDiagram
  nodeDataArray={nodeDataArray}
  linkDataArray={linkDataArray}
  modelData={modelData}
  skipsDiagramUpdate={skipsDiagramUpdate} // КРИТИЧНО!
  onModelChange={handleModelChange}
/>

// ❌ НЕПРАВИЛЬНО: Пустые массивы или отсутствие skipsDiagramUpdate
<ReactDiagram
  nodeDataArray={[]}  // GoJS не получит данные из Redux!
  linkDataArray={[]}
/>
```

### 2. **Инкрементальные обновления вместо полной замены**

**Правильно** (из примера GoJS):
```typescript
// Обрабатываем только измененные элементы
if (modifiedNodeData) {
  modifiedNodeData.forEach((nd) => {
    const idx = mapNodeKeyIdx.get(nd.key);
    if (idx !== undefined) {
      dispatch(modifyNode({ index: idx, data: nd }));
    }
  });
}

if (insertedNodeKeys) {
  insertedNodeKeys.forEach((key) => {
    const nd = modifiedNodeMap.get(key);
    if (nd) dispatch(insertNode(nd));
  });
}

if (removedNodeKeys) {
  dispatch(removeNodes(removedNodeKeys));
}
```

**Неправильно**:
```typescript
// ❌ Копирование всего состояния при каждом изменении
const allNodes = model.nodeDataArray.map(n => ({...n}));
dispatch(replaceAllNodes(allNodes)); // Неэффективно!
```

### 3. **Автоматический батчинг в React 18+**

**React 18+ автоматически объединяет множественные обновления состояния** в один ре-рендер, поэтому `batch()` из react-redux больше не нужен (и помечен как deprecated).

```typescript
// ✅ ПРАВИЛЬНО в React 18+: Все эти dispatch автоматически батчатся
dispatch(insertNode(node1));
dispatch(insertLink(link1));
dispatch(modifyModel(modelData));
dispatch(setSkips(true)); // Всего один ре-рендер!

// ❌ УСТАРЕЛО: batch() из react-redux deprecated
import { batch } from 'react-redux'; // Не используйте!
batch(() => { /* ... */ });
```

**Важно**: В GoJS примере используется старая версия React, где `batch()` был необходим. В современных приложениях на React 18+ он не нужен.

### 4. **Map для быстрого поиска по ключам**

```typescript
// ✅ ПРАВИЛЬНО: O(1) поиск
const mapNodeKeyIdx = useRef(new Map<go.Key, number>());

const refreshNodeIndex = (nodeArr: Array<go.ObjectData>) => {
  mapNodeKeyIdx.current.clear();
  nodeArr.forEach((n, idx) => {
    mapNodeKeyIdx.current.set(n.key, idx);
  });
};

const idx = mapNodeKeyIdx.current.get(nodeKey); // O(1)

// ❌ НЕПРАВИЛЬНО: O(n) поиск при каждом изменении
const idx = nodeDataArray.findIndex(n => n.key === nodeKey); // O(n)
```

### 5. **State Structure и очистка GoJS объектов**

```typescript
interface DiagramState {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  skipsDiagramUpdate: boolean; // КРИТИЧНО!
  // ... другие UI состояния
}
```

**⚠️ ВАЖНО: Очистка GoJS-специфичных объектов**

Redux требует сериализуемых данных. GoJS использует специальные классы (`List2`, `Point`, `Geometry` и т.д.), которые не сериализуются. 

**Перед отправкой в Redux все данные очищаются от GoJS объектов:**

```typescript
function cleanGoJSData(data: go.ObjectData): go.ObjectData {
  const cleaned: any = {};
  
  for (const key in data) {
    const value = data[key];
    
    // Пропускаем GoJS-специфичные объекты
    if (value instanceof go.List) continue;  // points: List2
    if (value instanceof go.Point) continue;
    if (value instanceof go.Geometry) continue;
    // ... и другие GoJS типы
    
    cleaned[key] = value;
  }
  
  return cleaned;
}

// Применяется перед каждым dispatch
const cleanedData = cleanGoJSData(nodeData);
dispatch(modifyNode({ index: idx, data: cleanedData }));
```

Это происходит автоматически в `useDiagramModelSync`, поэтому вам не нужно беспокоиться об этом.

## 📊 Структура Redux Store

### Actions (инкрементальные, не bulk)

```typescript
export const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    // Node operations
    insertNode: (state, action: PayloadAction<go.ObjectData>) => {
      state.nodeDataArray = [...state.nodeDataArray, action.payload];
    },
    modifyNode: (state, action: PayloadAction<{ index: number; data: go.ObjectData }>) => {
      state.nodeDataArray = state.nodeDataArray.map((item, idx) => 
        idx === action.payload.index ? action.payload.data : item
      );
    },
    removeNodes: (state, action: PayloadAction<Array<go.Key>>) => {
      state.nodeDataArray = state.nodeDataArray.filter(
        item => !action.payload.includes(item.key)
      );
    },
    
    // Link operations (аналогично)
    insertLink: /* ... */,
    modifyLink: /* ... */,
    removeLinks: /* ... */,
    
    // Model data
    modifyModel: /* ... */,
    
    // КРИТИЧНО: Управление циклическими обновлениями
    setSkips: (state, action: PayloadAction<boolean>) => {
      state.skipsDiagramUpdate = action.payload;
    },
  },
});
```

## 🔄 Потоки данных

### Поток 1: GoJS → Redux (изменения в диаграмме)

```
Пользователь редактирует диаграмму
         ↓
GoJS обновляет свою модель
         ↓
onModelChange(IncrementalData)
         ↓
handleModelChange обрабатывает изменения
         ↓
dispatch(insertNode(...))
dispatch(modifyLink(...))
dispatch(setSkips(true)) ← КРИТИЧНО!
// React 18+ автоматически батчит эти обновления
         ↓
Redux state обновлен
         ↓
skipsDiagramUpdate=true → ReactDiagram НЕ обновляет GoJS
```

### Поток 2: Redux → GoJS (ТОЛЬКО для внутренней синхронизации ReactDiagram)

**⚠️ ВАЖНО:** Этот поток используется **автоматически ReactDiagram компонентом**, а НЕ для программных изменений!

```
ReactDiagram получает props из Redux
         ↓
nodeDataArray, linkDataArray изменились
skipsDiagramUpdate === false
         ↓
ReactDiagram обновляет GoJS model
         ↓
GoJS получает новые данные
         ↓
onModelChange вызывается
         ↓
handleModelChange синхронизирует обратно в Redux
         ↓
dispatch(setSkips(true)) ← Цикл завершен
```

**Для программных изменений используйте GoJS API напрямую** (см. примеры выше).

## 💡 Примеры использования

### ⚠️ ВАЖНО: Как правильно изменять диаграмму

**В этом проекте используется правильный подход GoJS:**

✅ **Все изменения диаграммы делаются через GoJS API напрямую:**

```typescript
import { getDiagramFromDOM } from './utils/diagram-access';

function MyComponent() {
  const handleAddNode = () => {
    const result = getDiagramFromDOM();
    if (!result) return;
    
    const { diagram, model } = result;
    
    diagram.startTransaction('add node');
    model.addNodeData({
      key: generateUniqueKey(),
      text: 'New Node',
      color: 'lightblue',
      loc: '100 100'
    });
    diagram.commitTransaction('add node');
    
    // GoJS автоматически вызовет onModelChange
    // → Redux автоматически синхронизируется
  };
  
  return <button onClick={handleAddNode}>Add Node</button>;
}
```

❌ **НЕ делайте изменения через Redux → GoJS:**

```typescript
// НЕПРАВИЛЬНО! Не используйте этот подход!
dispatch(insertNode(newNode));
dispatch(setSkips(false));
// Это усложняет код и создает лишний цикл обновлений
```

**Причина:** GoJS уже имеет мощный API для изменений с транзакциями, undo/redo и валидацией. Использование Redux для изменений создает ненужную сложность.

### Изменение свойств существующих элементов (правильный подход)

```typescript
import { getDiagramFromDOM } from './utils/diagram-access';

function Inspector({ selectedNode }) {
  const handleTextChange = (newText: string) => {
    const result = getDiagramFromDOM();
    if (!result) return;
    
    const { diagram, model } = result;
    const nodeData = model.findNodeDataForKey(selectedNode.key);
    
    if (nodeData) {
      diagram.startTransaction('change text');
      model.setDataProperty(nodeData, 'text', newText);
      diagram.commitTransaction('change text');
      // GoJS автоматически вызовет onModelChange
      // → Redux автоматически синхронизируется
    }
  };
  
  return <input onChange={(e) => handleTextChange(e.target.value)} />;
}
```

**Именно так реализованы операции в `useEdgeOperations`** - через GoJS API.

## ⚠️ Частые ошибки

### ❌ Ошибка 1: Отсутствие `skipsDiagramUpdate`
```typescript
// БЕЗ skipsDiagramUpdate получается бесконечный цикл:
// GoJS → Redux → GoJS → Redux → GoJS → ...
```

### ❌ Ошибка 2: Передача пустых массивов в ReactDiagram
```typescript
// Redux не контролирует диаграмму!
<ReactDiagram 
  nodeDataArray={[]}  // ❌
  linkDataArray={[]}  // ❌
/>
```

### ❌ Ошибка 3: Попытка изменить диаграмму через Redux вместо GoJS API
```typescript
// НЕПРАВИЛЬНО! Не используйте Redux для изменений диаграммы!
dispatch(insertNode(newNode));
dispatch(setSkips(false));

// ✅ ПРАВИЛЬНО! Используйте GoJS API:
const { diagram, model } = getDiagramFromDOM();
diagram.startTransaction('add node');
model.addNodeData(newNode);
diagram.commitTransaction('add node');
```

### ✅ React 18+ автоматически батчит обновления
```typescript
// React 18+ автоматически объединяет эти обновления в один ре-рендер
dispatch(action1);
dispatch(action2);
dispatch(action3);
// Всего один ре-рендер!

// batch() из react-redux больше не нужен и помечен deprecated
```

## ✅ Checklist для проверки Redux интеграции

- [ ] `skipsDiagramUpdate` есть в state
- [ ] `setSkips` action реализован
- [ ] `ReactDiagram` получает `skipsDiagramUpdate` prop
- [ ] `ReactDiagram` получает data из Redux (не пустые массивы)
- [ ] Инкрементальные actions (insert/modify/remove), не bulk replace
- [ ] Map для индексирования ключей
- [ ] При изменениях от GoJS: `setSkips(true)` в `onModelChange`
- [ ] НЕ используется deprecated `batch()` из react-redux (React 18+ батчит автоматически)
- [ ] **Все изменения диаграммы делаются через GoJS API**, а не через dispatch Redux actions

## 📚 Ссылки

- [GoJS + React Guide](https://gojs.net/latest/intro/react.html)
- [GoJS React Redux Example](https://github.com/NorthwoodsSoftware/gojs-react-redux-basic)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React-Redux batch()](https://react-redux.js.org/api/batch)

