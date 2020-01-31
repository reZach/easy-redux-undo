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
                let lastChange = past[past.length - 1];
                diff.revertChange(present, true, lastChange);
                break;
            case REDO:

            break;
            default:
                const newPresent = reducer(present, action);

                // If the action did not alter the state,
                // return the initial state
                if (newPresent === state){
                    return state;
                }

                let actionDiff;
                
                if (typeof newPresent === "object"){
                    actionDiff = diff(present, newPresent);
                }

                return {
                    past: [...past, actionDiff],
                    present: newPresent,
                    future: []
                };
            break;
        }
    }
}