const diff = require("deep-diff").diff;

const UNDO = "@@UNDO";
const REDO = "@@REDO";

const undoable = function (reducer) {

    // return a reducer that handles undo and redo
    return function (state = {}, action) {
        const { past, present, future } = state;
        const initial = {
            past: [],
            present: reducer(undefined, {}),
            future: []
        };

        switch (action.type) {
            case UNDO:
                {
                    let lastChange = past[past.length - 1];
                    let newPast = past.slice(0, past.length - 1);
                    diff.revertChange(present, true, lastChange);
    
                    return {
                        past: newPast,
                        present,
                        future: [lastChange, ...future]
                    };
                }
            case REDO:
                {
                    let lastChange = future[0];
                    let newFuture = future.slice(1);
                    diff.applyChange(present, true, lastChange);
    
                    return {
                        past: [...past, lastChange],
                        present,
                        future: newFuture
                    }
                }
            default:
                {
                    const newPresent = reducer(present, action);

                    // If the action did not alter the state,
                    // return the initial state
                    if (newPresent === state){
                        return state;
                    }
    
                    let actionDiff;
                    let newPast = past;
                    
                    if (typeof newPresent === "object"){
                        actionDiff = diff(present, newPresent);
                        newPast = [...past, actionDiff];
                    }
    
                    return {
                        past: newPast,
                        present: newPresent,
                        future: []
                    };
                }
            break;
        }
    }
}