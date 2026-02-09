# Stock and Flow: Типы узлов и связей

## Результаты исследования

На основе анализа Vensim, Insight Maker и AnyLogic, система Stock and Flow содержит следующие элементы:

### Узлы (Nodes) — по документации [Insight Maker](https://insightmaker.com/docs)

| Тип | Визуал | Описание |
|-----|--------|----------|
| **Stock** | Прямоугольник (синий) | Накопитель — "bucket" для накопления/изъятия. Имеет начальное значение. [Docs](https://insightmaker.com/docs/stocks) |
| **Variable** | Овал (оранжевый) | Константа ИЛИ формула. Примеры: `birth_rate`, `[Stock1] + [Stock2]`, `Hours()^2`. [Docs](https://insightmaker.com/docs/variables) |

### Связи (Edges)

| Тип | Визуал | Описание |
|-----|--------|----------|
| **Flow** | Толстая стрелка с клапаном | Материальный поток между Stocks (или Stock ↔ ничего) |
| **Link** | Пунктирная стрелка | Информационная связь (зависимость в формуле) |

### Важно: Cloud — это НЕ отдельный узел!

**Cloud (облачко)** — это визуальный индикатор на конце Flow, когда:
- Flow входит "из ниоткуда" (источник = null) → облачко в начале
- Flow уходит "в нику|да" (цель = null) → облачко в конце

```
☁️ ══▶ Flow ══▶ [Stock]     // Flow из ниоткуда (inflow)
[Stock] ══▶ Flow ══▶ ☁️     // Flow в никуда (outflow)  
[Stock] ══▶ Flow ══▶ [Stock] // Flow между двумя Stocks
```

### Схема взаимодействия (как в Insight Maker)

```
                              ╭─────────────╮
                              │  Variable   │
                              ╰─────────────╯
                                    │
                                    │ Link (пунктир)
                                    ▼
☁️ ════════════▶ Flow ════════▶ ┌─────────┐
(облачко =                       │  Stock  │
 нет источника)                  └─────────┘
                                      │
                                      │
                          ════════════╧════════════
                          ▼                       ▼
                        Flow                    Flow
                          ║                       ║
                          ▼                       ▼
                    ┌─────────┐                  ☁️
                    │  Stock  │            (облачко =
                    └─────────┘             нет цели)
                          │
                          │ Link (пунктир)
                          ▼
                    ┌─────────┐
                    │  Stock  │
                    └─────────┘
```

**Ключевые моменты из скриншота Insight Maker:**

1. **Flow** — это связь (edge) с визуалом стрелки и надписью, НЕ отдельный узел
2. **Облачко** автоматически появляется если один конец Flow не привязан к Stock
3. **Link** — пунктирная стрелка для информационных связей (Variable → Stock, Stock → Stock)
4. **Stock** — синий прямоугольник
5. **Variable** — оранжевый овал

---

## Пример реальной системы: SIR-модель эпидемии

Классическая модель распространения инфекции (Susceptible → Infected → Recovered):

```
╭──────────────╮              ╭───────────────╮
│ Contact Rate │              │ Recovery Time │
│    (0.4)     │              │     (14)      │
╰──────────────╯              ╰───────────────╯
         │                           │
         │ Link                      │ Link
         ▼                           ▼
   ╭───────────╮               ╭───────────╮
   │ Infection │               │ Recovery  │
   │   Rate    │               │   Rate    │
   ╰───────────╯               ╰───────────╯
         │                           │
         │ Link                      │ Link
         ▼                           ▼
☁️ ══════════▶ ┌─────────────┐ ══════════▶ ┌─────────────┐ ══════════▶ ┌─────────────┐ ══════════▶ ☁️
   Births      │ Susceptible │  Infection  │  Infected   │  Recovery   │  Recovered  │   Deaths
   (Flow)      │   (Stock)   │   (Flow)    │   (Stock)   │   (Flow)    │   (Stock)   │   (Flow)
               │   999 чел.  │             │   1 чел.    │             │   0 чел.    │
               └─────────────┘             └─────────────┘             └─────────────┘
                     │                           │
                     │ Link                      │ Link  
                     └───────────────────────────┘
                              (для формулы Infection Rate)
```

### Элементы модели:

**Stocks (Накопители):**
- `Susceptible` — восприимчивые к болезни (начальное значение: 999)
- `Infected` — заражённые (начальное значение: 1)
- `Recovered` — выздоровевшие (начальное значение: 0)

**Flows (Потоки):**
- `Infection` — поток заражения (S → I)
- `Recovery` — поток выздоровления (I → R)
- `Births` — рождаемость (Cloud → S)
- `Deaths` — смертность (R → Cloud)

**Variables (Переменные):**
- `Infection Rate` = `[Susceptible] * [Infected] * [Contact Rate] / ([Susceptible] + [Infected] + [Recovered])`
- `Contact Rate` = `0.4` (константа — вероятность контакта в день)
- `Recovery Time` = `14` (константа — дней до выздоровления)

### Формулы:

```
Infection.rate = Susceptible × Infected × Contact_Rate / (S + I + R)
Recovery.rate = Infected / Recovery_Time
Susceptible' = Births - Infection
Infected' = Infection - Recovery  
Recovered' = Recovery - Deaths
```

---

## Ещё примеры реальных систем

### Модель банковского счёта

```
                 ╭─────────────────╮
                 │ Interest Rate   │  ← Variable (константа 0.03)
                 │     (3%)        │
                 ╰─────────────────╯
                          │
                          │ Link
                          ▼
                    ╭───────────╮
                    │ Interest  │  ← Variable (формула: [Balance] * [Interest Rate])
                    ╰───────────╯
                          │
                          │ Link
                          ▼
☁️ ══════════════════▶ ┌─────────┐ ══════════════════▶ ☁️
      Income (Flow)    │ Balance │    Expenses (Flow)
                       │  $1000  │  ← Stock
                       └─────────┘
```

### Модель водохранилища

```
╭──────────────╮                              ╭─────────╮
│ Precipitation│  ← Variable                  │ Demand  │  ← Variable
│     Rate     │                              ╰─────────╯
╰──────────────╯                                    │
       │                                            │ Link
       │ Link                                       ▼
       ▼
☁️ ══════════════════▶ ┌───────────┐ ══════════════════▶ ☁️
    Rainfall (Flow)    │ Reservoir │     Outflow (Flow)
                       │  Volume   │  ← Stock
                       └───────────┘
                            │
                            │ Link
                            ▼
                      ╭─────────────╮
                      │ Water Level │  ← Variable (формула: [Reservoir Volume] / Area)
                      ╰─────────────╯
```

---

## План реализации

### 1. Обновить типы узлов

В `src/types/node.ts`:

```typescript
export type NodeVariant = 
  | 'stock'      // Накопитель (синий прямоугольник)
  | 'variable';  // Формула или константа (оранжевый овал)

// Cloud НЕ является узлом! Это визуальный элемент Flow.
```

Добавить специфичные данные для каждого типа:

```typescript
export interface StockNodeData extends BaseNodeData {
  initialValue?: number;
  units?: string;
}

export interface VariableNodeData extends BaseNodeData {
  /** Формула или константа. Примеры: "100", "[Stock1] * 0.5", "Hours()^2" */
  value?: string;
}
```

### 2. Обновить типы связей

В `src/types/edge.ts`:

```typescript
export type EdgeVariant = 
  | 'flow'   // Материальный поток (толстая стрелка, может иметь облачко на конце)
  | 'link';  // Информационная связь (пунктирная стрелка)
```

Данные для связей:

```typescript
export interface FlowEdgeData extends BaseEdgeData {
  /** Если source = null, рисуем облачко в начале (inflow из ниоткуда) */
  /** Если target = null, рисуем облачко в конце (outflow в никуда) */
  rate?: number;
  units?: string;
}

export interface LinkEdgeData extends BaseEdgeData {
  // Информационная связь — показывает зависимость в формуле
  // Визуально: пунктирная линия со стрелкой
}
```

**Особенность Flow:**
- `source: null` → рисуем облачко ☁️ в начале стрелки
- `target: null` → рисуем облачко ☁️ в конце стрелки
- Оба заполнены → обычная стрелка между двумя Stocks

### 3. Обновить константы

В `src/constants/node.ts`:
```typescript
export const STOCK_COLORS = {
  background: '#a8c5e2',  // светло-синий
  border: '#5b9bd5',
  text: '#1a1a1a',
};

export const VARIABLE_COLORS = {
  background: '#f8cbad',  // оранжевый/персиковый
  border: '#ed7d31',
  text: '#1a1a1a',
};
```

В `src/constants/edge.ts`:
```typescript
export const FLOW_EDGE = {
  strokeWidth: 3,
  color: '#5b9bd5',
  cloudSize: 20,
};

export const LINK_EDGE = {
  strokeWidth: 1.5,
  color: '#666666',
  dashArray: '5,5',
};
```

### 4. Создать компоненты узлов

Создать компоненты в `src/components/nodes/`:
- `StockNode.tsx` — синий прямоугольник
- `VariableNode.tsx` — оранжевый овал (формула/константа)

### 5. Создать компоненты связей

Обновить `src/components/edges/`:
- `FlowEdge.tsx` — толстая стрелка, рисует облачко если source/target = null
- `LinkEdge.tsx` — пунктирная стрелка

### 6. Обновить registry файлы

- `src/components/nodes/registry.ts`
- `src/components/edges/registry.ts`

---

## Примечание о текущем коде

Текущий `circular` тип узла соответствует концепции `variable` в Stock and Flow. CircularNode можно переименовать/адаптировать в VariableNode.

---

## Правила соединений и вычислений

---

### Flow (материальный поток)

Flow — это **связь**, которая изменяет значение Stock каждый шаг симуляции.
Flow имеет **формулу** (rate), которая определяет скорость потока.

#### Stock → ☁️ (Outflow в никуда)

```
┌─────────┐                    
│  Stock  │ ════════════▶ ☁️
│  (100)  │    Flow
└─────────┘    rate = ?
```

- Создаётся Flow с облачком на конце
- Flow имеет доступ к `[Stock]` в своей формуле
- **Пример формулы Flow:** `[Stock] * 0.1` — 10% Stock уходит каждый шаг
- **Результат:** `Stock' = Stock - Flow.rate`

#### ☁️ → Stock (Inflow из ниоткуда)

```
                    ┌─────────┐
☁️ ════════════▶    │  Stock  │
       Flow         │   (0)   │
     rate = ?       └─────────┘
```

- Создаётся Flow с облачком в начале
- Flow имеет доступ к `[Stock]` в своей формуле (target stock)
- **Пример формулы Flow:** `10` — добавляем 10 единиц каждый шаг
- **Результат:** `Stock' = Stock + Flow.rate`

#### Stock → Stock (Поток между двумя накопителями)

```
┌─────────┐              ┌─────────┐
│ Stock A │ ══════════▶  │ Stock B │
│  (100)  │    Flow      │   (0)   │
└─────────┘  rate = ?    └─────────┘
```

- Flow имеет доступ к **обоим** Stocks: `[Stock A]` и `[Stock B]`
- **Пример формулы Flow:** `[Stock A] * 0.2` — 20% из A переходит в B
- **Результат:** 
  - `Stock A' = Stock A - Flow.rate`
  - `Stock B' = Stock B + Flow.rate`

---

### Link (информационная связь)

Link — это **пунктирная стрелка**, которая передаёт значение примитива для использования в формуле другого примитива. Link **не изменяет** значения, только даёт доступ.

---

#### 1. Stock → Stock

```
┌─────────────┐
│   Stock A   │
│    (100)    │
└─────────────┘
       │
       │ Link (пунктир)
       ▼
┌─────────────┐
│   Stock B   │
│ initial = [Stock A] * 0.5
└─────────────┘
```

- Stock B получает доступ к `[Stock A]` для своей формулы
- **Пример:** начальное значение Stock B зависит от Stock A
- **Примечание:** это информационная связь, НЕ материальный поток

---

#### 2. Stock → Variable

```
┌─────────┐
│  Stock  │
│  (100)  │
└─────────┘
       │
       │ Link (пунктир)
       ▼
╭──────────────╮
│   Variable   │
│ value = [Stock] * 2
╰──────────────╯
```

- Variable получает доступ к `[Stock]` в своей формуле
- **Пример формулы Variable:** `[Stock] * 2` = 200
- **Результат:** Variable.value = 200 (пересчитывается каждый шаг)

**Множественные входы:**

```
┌─────────┐     ┌─────────┐
│ Stock A │     │ Stock B │
│  (100)  │     │  (50)   │
└─────────┘     └─────────┘
       │              │
       │ Link         │ Link
       └──────┬───────┘
              ▼
       ╭──────────────╮
       │   Variable   │
       │ value = [Stock A] + [Stock B]
       ╰──────────────╯
```

- Variable получает доступ к **нескольким** Stocks
- **Пример:** `[Stock A] + [Stock B]` = 150 (Total Population)

---

#### 3. Stock → Flow

```
┌─────────────┐
│  Stock A    │
│   (1000)    │  ← Например, Total Population
└─────────────┘
       │
       │ Link (пунктир)
       ▼
┌─────────┐              
│ Stock B │ ══════════▶ ☁️
│  (100)  │    Flow
└─────────┘  rate = [Stock B] * [Stock A] * 0.001
```

- Flow получает доступ к `[Stock A]` через Link (в дополнение к своим endpoint Stocks)
- **Пример:** Flow.rate зависит от Stock A, который не является endpoint этого Flow
- **Использование:** когда скорость потока зависит от внешнего Stock
- **Формула:** `[Stock B] * [Stock A] * 0.001` — скорость зависит от обоих Stocks

---

#### 4. Variable → Stock

```
╭──────────────╮
│   Variable   │
│ value = 100  │
╰──────────────╯
       │
       │ Link (пунктир)
       ▼
┌─────────────┐
│    Stock    │
│ initial = [Variable]
└─────────────┘
```

- Stock получает доступ к `[Variable]` для начального значения
- **Пример:** `[Variable] + 300` = 400
- **Использование:** задание начального значения Stock через переменную
- **Примечание:** В runtime Stock изменяется только через Flow, но Variable может задавать initial value

---

#### 5. Variable → Variable

```
╭──────────────╮
│  Variable A  │
│  value = 10  │
╰──────────────╯
       │
       │ Link (пунктир)
       ▼
╭──────────────╮
│  Variable B  │
│ value = [Variable A] + 5
╰──────────────╯
```

- Variable B получает доступ к `[Variable A]`
- **Пример формулы:** `[Variable A] + 5` = 15
- **Результат:** Variable B.value = 15

---

#### 6. Variable → Flow

```
╭──────────────╮
│   Variable   │
│ rate = 0.05  │
╰──────────────╯
       │
       │ Link (пунктир)
       ▼
┌─────────┐              
│  Stock  │ ══════════▶ ☁️
│  (100)  │    Flow
└─────────┘  rate = [Stock] * [Variable]
```

- Flow получает доступ к `[Variable]` в своей формуле
- **Пример формулы Flow:** `[Stock] * [Variable]` = 100 * 0.05 = 5
- **Результат:** Flow.rate = 5, Stock уменьшается на 5 каждый шаг

**Множественные входы:**

```
╭──────────╮   ╭─────────────╮
│   Rate   │   │ Multiplier  │
│   0.1    │   │     2       │
╰──────────╯   ╰─────────────╯
       │              │
       │ Link         │ Link
       └──────┬───────┘
              ▼
┌─────────┐              
│  Stock  │ ══════════▶ ☁️
│  (100)  │    Flow
└─────────┘  rate = [Stock] * [Rate] * [Multiplier]
```

- Flow получает доступ к нескольким Variables
- **Пример:** `[Stock] * [Rate] * [Multiplier]` = 100 * 0.1 * 2 = 20

---

#### 7. Flow → Stock

```
┌─────────┐              
│ Stock A │ ══════════▶ ☁️
│  (100)  │    Flow X
└─────────┘  rate = 10
                 │
                 │ Link (пунктир)
                 ▼
           ┌─────────────┐
           │   Stock B   │
           │ initial = [Flow X] * 5
           └─────────────┘
```

- Stock B получает доступ к `[Flow X]` — текущему rate потока
- **Пример:** `[Flow X]` = 10 (текущая скорость потока)
- **Использование:** когда нужно знать текущую скорость потока для вычислений
- **Значение Flow:** `[Flow X]` возвращает текущий rate этого потока

---

#### 8. Flow → Variable

```
┌─────────┐              
│  Stock  │ ══════════▶ ☁️
│  (100)  │    Flow
└─────────┘  rate = 10
                 │
                 │ Link (пунктир)
                 ▼
           ╭──────────────╮
           │   Variable   │
           │ value = [Flow] * 2
           ╰──────────────╯
```

- Variable получает доступ к `[Flow]` — текущему rate потока
- **Пример формулы:** `[Flow] * 2` = 20
- **Использование:** мониторинг, вычисление производных показателей от скорости потока

---

#### 9. Flow → Flow

```
┌─────────┐              
│ Stock A │ ══════════▶ ☁️
│  (100)  │    Flow X
└─────────┘  rate = 10
                 │
                 │ Link (пунктир)
                 ▼
┌─────────┐              
│ Stock B │ ══════════▶ ☁️
│  (50)   │    Flow Y
└─────────┘  rate = [Stock B] + [Flow X]
```

- Flow Y получает доступ к `[Flow X]` — rate другого потока
- **Пример формулы:** `[Stock B] + [Flow X]` = 50 + 10 = 60
- **Использование:** один поток зависит от скорости другого потока
- **Значение:** `[Flow X]` возвращает текущий rate потока X

---

### Сводная таблица всех Link соединений

| № | Source | Target | Доступ в Target | Пример использования |
|---|--------|--------|-----------------|---------------------|
| 1 | **Stock** | **Stock** | `[Stock A]` | Initial value зависит от другого Stock |
| 2 | **Stock** | **Variable** | `[Stock]` | Variable вычисляет что-то на основе Stock |
| 3 | **Stock** | **Flow** | `[Stock]` | Flow rate зависит от внешнего Stock |
| 4 | **Variable** | **Stock** | `[Variable]` | Stock initial зависит от Variable |
| 5 | **Variable** | **Variable** | `[Variable]` | Цепочка вычислений |
| 6 | **Variable** | **Flow** | `[Variable]` | Flow rate зависит от Variable |
| 7 | **Flow** | **Stock** | `[Flow]` = rate | Stock зависит от скорости потока |
| 8 | **Flow** | **Variable** | `[Flow]` = rate | Variable мониторит скорость потока |
| 9 | **Flow** | **Flow** | `[Flow]` = rate | Один поток зависит от скорости другого |

---

### Сводная таблица соединений

#### Flow (материальный поток) — ТОЛЬКО между Stocks

| Source | Target | Результат |
|--------|--------|-----------|
| Stock | ☁️ | Outflow из Stock в никуда |
| ☁️ | Stock | Inflow в Stock из ниоткуда |
| Stock A | Stock B | Поток между двумя Stocks |

#### Link (информационная связь) — между ЛЮБЫМИ примитивами

| Source | Target | Что происходит | Доступ в формуле Target |
|--------|--------|----------------|-------------------------|
| **Stock** | **Stock** | Stock A в формуле Stock B | `[Stock A]` |
| **Stock** | **Variable** | Stock в формуле Variable | `[Stock]` |
| **Stock** | **Flow** | Stock в формуле Flow | `[Stock]` |
| **Variable** | **Stock** | Variable в формуле Stock | `[Variable]` |
| **Variable** | **Variable** | Цепочка вычислений | `[Variable]` |
| **Variable** | **Flow** | Variable влияет на скорость Flow | `[Variable]` |
| **Flow** | **Stock** | Rate потока в формуле Stock | `[Flow]` (= rate) |
| **Flow** | **Variable** | Rate потока в формуле Variable | `[Flow]` (= rate) |
| **Flow** | **Flow** | Rate одного потока в формуле другого | `[Flow]` (= rate) |

---

### Запрещённые соединения

| Соединение | Почему запрещено |
|------------|------------------|
| **Flow: Variable ↔ Variable** | Variable не накапливает — только Stock может быть источником/целью Flow |
| **Flow: Variable ↔ Stock** | Variable не накапливает |

---

### Порядок вычислений (каждый шаг симуляции)

1. **Variables** — вычисляются все формулы переменных (в порядке зависимостей)
2. **Flows** — вычисляются все формулы потоков (rate)
3. **Stocks** — обновляются значения: `Stock' = Stock + Inflows - Outflows`

