import {
    createAction
} from "@reduxjs/toolkit";
const _ = require("lodash");
const diff = require("deep-diff").diff;

const WRAPKEY = "__wrapper";
const UNDOSTR = "@@easy-redux-undo/UNDO";
const REDOSTR = "@@easy-redux-undo/REDO";
const UNDO = createAction(UNDOSTR);
const REDO = createAction(REDOSTR);

const defaultOptions = {
    maxHistory: 100,
    undoType: UNDOSTR,
    redoType: REDOSTR
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
            case UNDOSTR: {
                if (past.length === 0) {
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

                    // We use obj destructuring above, and so need
                    // to create a new reference to edit the state
                    lastChange = past[past.length - i];
                    newPast = past.slice(0, past.length - i);
                    newPresent = !!newPresent ? newPresent : _.cloneDeep(present);

                    // Need to wrap present in object if state is
                    // an array, because deep-diff can't handle
                    // comparisons of arrays
                    if (Array.isArray(newPresent)) {
                        newPresent[`${WRAPKEY}`] = newPresent;
                    }

                    // Revert the changes applied to the state
                    for (var j = 0; j < lastChange.length; j++) {
                        diff.revertChange(newPresent, true, lastChange[j]);
                    }

                    // Unwrap array if state is an array
                    newPresent = Array.isArray(newPresent) ? newPresent[`${WRAPKEY}`] : newPresent;

                    // Update the future array
                    newFuture = [lastChange, ...(!!newFuture ? newFuture : future)];

                    if (newPast.length === 0) break;
                }

                return {
                    past: newPast,
                    present: newPresent,
                    future: newFuture
                };
            }
            case REDOSTR: {
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

                    // We use obj destructuring above, and so need
                    // to create a new reference to edit the state
                    lastChange = future[i - 1];
                    newFuture = future.slice(i);
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
    REDO
};
export default undoable;