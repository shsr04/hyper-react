# hyper-react

`hyper-react` provides a simple hook factory for **making React hooks globally shared across an entire React application**.

## Installation

First, make sure you have installed the React packages:
```sh
yarn add react react-dom
```

Then, install `hyper-react` from this repo:
```sh
yarn add "hyper-react@https://github.com/shsr04/hyper-react#v1.0.0"
```

## Usage

Minimal usage example:

```typescript
// useCounter.ts
import { useState } from "react"
import hyper from "hyper-react"

function useCounterState() {
    const [count, setCount] = useState(0)
    return { count, setCount }
}

export const useCounter = hyper(useCounterState)
```

In this example, the hook `useCounterState` is passed to the `hyper` hook factory, producing a globally shared copy of `useCounterState`. Then, the shared hook is exported as `useCounter`, such that callers of the hook do not need to care about the internal hyper-hook wiring.