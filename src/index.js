import {
    createAction
} from "@reduxjs/toolkit";
const _ = require("lodash");
const diff = require("deep-diff").diff;

const WRAPKEY = "__wrapper";
const LIBRARYPREFIX = "@@easy-redux-undo/";
const UNDOACTION = `${LIBRARYPREFIX}UNDO`;
const REDOACTION = `${LIBRARYPREFIX}REDO`;
const CLEARACTION = `${LIBRARYPREFIX}CLEAR`;
const GROUPBEGIN = `${LIBRARYPREFIX}GROUPBEGIN`;
const GROUPEND = `${LIBRARYPREFIX}GROUPEND`;
const UNDO = createAction(UNDOACTION);
const REDO = createAction(REDOACTION);
const CLEAR = createAction(CLEARACTION);

const defaultOptions = {
    maxHistory: 100,
    undoType: UNDOACTION,
    redoType: REDOACTION,
    clearType: CLEARACTION
};

const undoable = function (reducer, options = {}) {
    options = Object.assign(defaultOptions, options);

    // return a reducer that handles undo and redo
    return function (state = {}, action) {
        const {
            past,
            present,
            future
        } = state;

        // If we are calling this reducer for the first time,
        // present will not have a value and we should return
        // a default value
        if (typeof present === "undefined") {
            return {
                past: [],
                present: reducer(undefined, {}),
                future: []
            };
        }

        // We can pass a number for the number of undo/redos to do;
        // parse this value out here
        let actionCount = typeof action.payload === "number" && action.payload > 0 ? action.payload : 1;

        switch (action.type) {
            case GROUPBEGIN: {
                return {
                    past: [...past, GROUPBEGIN],
                    present,
                    future
                };
            }
            case GROUPEND: {
                return {
                    past: [...past, GROUPEND],
                    present,
                    future
                };
            }
            case UNDOACTION: {
                if (past.length === 0) {
                    return {
                        past,
                        present,
                        future
                    };
                }

                let changesToApply;
                let newPast;
                let newPresent;
                let newFuture;

                for (let i = 1; i <= actionCount; i++) {
                    
                    let endIndex = past.length - i;

                    // 
                    if (changesToApply === GROUPBEGIN){
                        for (endIndex; endIndex >= 0; endIndex--){
                            if (past[endIndex] === GROUPEND) break;
                        }

                        if (endIndex === 0 && past[endIndex] !== GROUPEND){
                            throw "Found beginning of group but no end! Cannot undo!";
                        }

                        changesToApply = past.slice(0, endIndex);
                    } else {
                        changesToApply = past[endIndex];
                    }

                    for (let c = 0; c < changesToApply.length; c++){

                    }

                    newPast = past.slice(0, endIndex);
                    
                    // We use obj destructuring above, and so need
                    // to create a new reference to edit the state
                    newPresent = !!newPresent ? newPresent : _.cloneDeep(present);

                    // Need to wrap present in object if state is
                    // an array, because deep-diff can't handle
                    // comparisons of arrays
                    if (Array.isArray(newPresent)) {
                        newPresent[`${WRAPKEY}`] = newPresent;
                    }

                    // Revert the changes applied to the state
                    for (var j = 0; j < changesToApply.length; j++) {
                        diff.revertChange(newPresent, true, changesToApply[j]);
                    }

                    // Unwrap array if state is an array
                    newPresent = Array.isArray(newPresent) ? newPresent[`${WRAPKEY}`] : newPresent;

                    // Update the future array
                    newFuture = [changesToApply, ...(!!newFuture ? newFuture : future)];

                    if (newPast.length === 0) break;
                }

                return {
                    past: newPast,
                    present: newPresent,
                    future: newFuture
                };
            }
            case REDOACTION: {
                if (future.length === 0) {
                    return {
                        past,
                        present,
                        future
                    };
                }

                let lastChange;
                let newPast;
                let newPresent;
                let newFuture;

                for (let i = 1; i <= actionCount; i++) {
                    
                    lastChange = future[i - 1];
                    newFuture = future.slice(i);

                    // We use obj destructuring above, and so need
                    // to create a new reference to edit the state
                    newPresent = !!newPresent ? newPresent : _.cloneDeep(present);

                    // Need to wrap present in object if state is
                    // an array, because deep-diff can't handle
                    // comparisons of arrays
                    if (Array.isArray(newPresent)) {
                        newPresent[`${WRAPKEY}`] = newPresent;
                    }

                    // Apply the changes to the state
                    for (var k = 0; k < lastChange.length; k++) {
                        diff.applyChange(newPresent, true, lastChange[k]);
                    }

                    // Unwrap array if state is an array
                    newPresent = Array.isArray(newPresent) ? newPresent[`${WRAPKEY}`] : newPresent;

                    // Update the past array
                    newPast = [...(!!newPast ? newPast : past), lastChange];

                    if (newFuture.length === 0) break;
                }

                return {
                    past: newPast,
                    present: newPresent,
                    future: newFuture
                };
            }
            default: {
                const newPresent = reducer(present, action);
                let actionDiff;

                // If state is an array, deep-diff can't handle
                // comparing arrays, so we wrap the array in an object
                if (Array.isArray(newPresent)) {
                    actionDiff = diff({
                        WRAPKEY: present
                    }, {
                        WRAPKEY: newPresent
                    });
                } else if (typeof newPresent === "object") {
                    actionDiff = diff(present, newPresent);
                }

                // If the action did not alter the state,
                // return the initial state
                if (typeof actionDiff === "undefined") {
                    return state;
                }

                return {
                    past: [...past.slice(past.length === options.maxHistory ? 1 : 0), actionDiff], // If maxHistory is defined, don't store than x number of events in the past
                    present: newPresent,
                    future: []
                };
            }
        }
    }
}

export {
    UNDO,
    REDO,
    CLEAR
};
export default undoable;