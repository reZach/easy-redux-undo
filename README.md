# easy-redux-undo
Literally the _easiest_ redux undo/redo library. In addition to being easy, we also offer a collection of great features that you will use all the time!

## Feature-list
- Holds past/future history
- Stores actions as diffs intead of storing the whole state
- Can dispatch multiple undo/redos as a single action
- Able to clear history
- Actions can be undo/redo'd as a group
- Can include/exclude actions from being undo/redo-able
- Configurable options (max history limit, custom action names, etc.)
- Just _works_ out of the box

## How to use
```
npm i easy-redux-undo
```

Then, add `undoable` to a reducer:

```javascript
import undoable from "easy-redux-undo";
import counterReducer from "path/to/reducer/counterReducer";

const createRootReducer =>
  undoable: undoable(
      counter: counterReducer
  )
});

export default createRootReducer;
```

Finally, update your component with actions to dispatch. See this sample component below that uses some of the libraries' features:
```jsx
import React from "react";
import { connect } from "react-redux";
import { UNDO, REDO, CLEAR, GROUPBEGIN, GROUPEND } from "easy-redux-undo";
import { increment, decrement } from "path/to/reducer/counterReducer";

class MyComponent extends React.Component {
  constructor() {
    super();

    // Counter-specific
    this.inc = this.inc.bind(this);
    this.dec = this.dec.bind(this);

    // Undo-specific
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.undoX = this.undoX.bind(this);
    this.redoX = this.redoX.bind(this);
    this.groupbegin = this.groupbegin.bind(this);
    this.groupend = this.groupend.bind(this);
    this.clear = this.clear.bind(this);
  }

  // Increments counter
  inc() {
    this.props.increment();
  }

  // Decrements counter
  dec() {
    this.props.decrement();
  }

  // Undos last action
  undo() {
    this.props.UNDO();
  }

  // Redos last action
  redo() {
    this.props.REDO();
  }

  // Undos x amount of actions
  undoX(count) {
    this.props.UNDO(count);
  }

  // Redos x amount of actions
  redoX(count) {
    this.props.REDO(count);
  }

  // Begins a group
  groupbegin(){
    this.props.GROUPBEGIN();
  }

  // Ends a group
  groupend(){
    this.props.GROUPEND();
  }

  // Clears all history
  clear(){
    this.props.CLEAR();
  }

  render() {
    return (
      <div>
        <h4>Undo/Redo</h4>
        <span>
          Try out modifying, and then undo/redoing the redux history below!
        </span>
        <div>
          <h3>Counter</h3>
          {this.props.counter.value}
          <div>
            <button onClick={this.dec}>dec</button>
            <button onClick={this.inc}>inc</button>
          </div>
        </div>
        <button onClick={() => this.undoX(2)}>undo 2</button>
        <button onClick={this.undo}>undo</button>
        <button onClick={this.redo}>redo</button>
        <button onClick={() => this.redoX(2)}>redo 2</button>
        <button onClick={this.groupbegin}>group begin</button>
        <button onClick={this.groupend}>group end</button>
        <button onClick={this.clear}>clear</button>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  counter: state.undoable.present.counter
});
const mapDispatch = { increment, decrement, UNDO, REDO, GROUPBEGIN, GROUPEND };

export default connect(mapStateToProps, mapDispatch)(MyComponent);
```

You are done! ✔️

## FAQ
### Why do I need to include `.present` in my component?
The reducer creates 3 properties in which your current state (ie. `present`) and past/future (ie. `past`/`future`) actions live, it's necessary to grab the value from the `present` property in your components.

See a sample of modifications you will need to make before/after using this library:
**BEFORE**
```javascript
const mapStateToProps = (state, props) => ({
  counter: state.undoable.counter
});
```

**AFTER**
```javascript
const mapStateToProps = (state, props) => ({
  counter: state.undoable.present.counter
});
```

### What do you mean by "Stores actions as diffs intead of storing the whole state"?
Libraries such as (the popular) [redux-undo](https://github.com/omnidan/redux-undo) library stores actions by storing copies of the state in the `past` and `future` arrays. This may work for small projects, but quickly becomes unscalable when making any real app.

This library uses [deep-diff](https://github.com/flitbit/diff) to create diffs whenever an action is made, this makes undo/redoing actions _much_ more efficient.

> If you don't end up using this library, be sure your library stores actions as diffs instead of the entire state!

### What do you mean by "Actions can be undo/redo'd as a group"?
Say you have an application that has a few different actions, and you want these actions to be undo/redo-able in a group. For this example, let's assume that the actions are `SWITCH_TAB`, `SORT_LIST` and `TOGGLE_SETTING`. Upon clicking your "undo" button in the UI, these actions should be undone in a group.

To do this, you can send dispatch a `GROUPBEGIN` action before you send your other actions, and a `GROUPEND` action once you are done. You'll be able to undo all 3 actions at once (in the sequence they were dispatched).

If we were using the above example that would be something like this:

```javascript
this.props.GROUPBEGIN(); // begin group
this.props.SWITCHTAB();
this.props.SORTLIST();
this.props.TOGGLESETTING();
this.props.GROUPEND(); // end group; all actions are now in one undo-able action
```

### How do I include/exclude actions from being undo/redo-able?
Sometimes, you may want to include/exclude certain actions from being undo/redo-able. To configure these actions, simply update the `include` **or** `exclude` properties on the options object you can pass in when configuring the reducer.

> Don't include both the `include` and `exclude` properties or you'll get an error!

Here's an example:
```javascript
import undoable from "easy-redux-undo";
import counterReducer from "path/to/reducer/counterReducer";

const createRootReducer =>
  undoable: undoable(
      counter: counterReducer
  , {
      include: [
          "REDUCER/MYACTION1",
          "REDUCER/MYACTION2"
      ]
  })
});

export default createRootReducer;
```

_Or_, an example of excluding actions:
```javascript
import undoable from "easy-redux-undo";
import counterReducer from "path/to/reducer/counterReducer";

const createRootReducer =>
  undoable: undoable(
      counter: counterReducer
  , {
      exclude: [
          "REDUCER/MYACTION3",
          "REDUCER/MYACTION4"
      ]
  })
});

export default createRootReducer;
```

### What options do we have for configuring the reducer?
You can pass in any of these values to configure the reducer, all of the values seen below are defaults.

> Additionally, you see below that you can change the limit of actions that are saved in the undo/redo history through the `maxHistory` property.

```
{
    maxHistory: 100,
    undoType: "@@easy-redux-undo/UNDO",
    redoType: "@@easy-redux-undo/REDO",
    clearType: "@@easy-redux-undo/CLEAR",
    groupBeginType: "@@easy-redux-undo/GROUPBEGIN",
    groupEndType: "@@easy-redux-undo/GROUPEND",
    include: [],
    exclude: []
}
```

### How do I _actually_ configure the reducer in a production app?
Too often, the samples we (including me) give to configure the reducer aren't enough. Apps are complicated, and so should the example. Here's a more-complete example of what your reducer might look like.

The below sample has a few things, namely an HTML history, and at least once reducer that is _not_ undoable (the `home` reducer).

> PS - this is taken out of [`secure-electron-template`](https://github.com/reZach/secure-electron-template) (the template this library was built to use).

```javascript
import { combineReducers } from "redux";
import { connectRouter } from "connected-react-router";
import undoable from "easy-redux-undo";
import homeReducer from "../components/home/homeSlice";
import counterReducer from "../components/counter/counterSlice";
import complexReducer from "../components/complex/complexSlice";

const createRootReducer = (history) =>
  combineReducers({
    router: connectRouter(history),
    home: homeReducer,
    undoable: undoable(
      combineReducers({
        counter: counterReducer,
        complex: complexReducer
      })
    )
  });

export default createRootReducer;
```