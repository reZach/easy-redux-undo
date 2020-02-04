import { createAction } from "@reduxjs/toolkit";
const _ = require("lodash");
const diff = require("deep-diff").diff;

const WRAPKEY = "__wrapper";
const UNDOSTR = "@@easy-redux-undo/UNDO";
const REDOSTR = "@@easy-redux-undo/REDO";
const UNDO = createAction(UNDOSTR);
const REDO = createAction(REDOSTR);

const defaultOptions = {
    debug: false,
    maxHistory: 40
};

const undoable = function (reducer, options = defaultOptions) {

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
        if (typeof present === "undefined"){
            return {
                past: [],
                present: reducer(undefined, {}),
                future: []
            };
        }

        switch (action.type) {
            case UNDOSTR: {
                if (past.length === 0){
                    return {
                        past,
                        present,
                        future
                    };
                }
                
                // We use obj destructuring above, and so need
                // to create a new reference to edit the state
                let lastChange = past[past.length - 1];
                let newPast = past.slice(0, past.length - 1);                
                let newPresent = _.cloneDeep(present);

                // Need to wrap present in object if state is
                // an array, because deep-diff can't handle
                // comparisons of arrays
                if (Array.isArray(newPresent)){
                    newPresent[`${WRAPKEY}`] = newPresent;
                }

                for (let i = 0; i < lastChange.length; i++){
                    diff.revertChange(newPresent, true, lastChange[i]);
                }

                return {
                    past: newPast,
                    present: Array.isArray(newPresent) ? newPresent[`${WRAPKEY}`] : newPresent,
                    future: [lastChange, ...future]
                };
            }
            case REDOSTR: {
                if (future.length === 0){
                    return {
                        past,
                        present,
                        future
                    };
                }

                // We use obj destructuring above, and so need
                // to create a new reference to edit the state
                let lastChange = future[0];
                let newFuture = future.slice(1);
                let newPresent = _.cloneDeep(present);

                // Need to wrap present in object if state is
                // an array, because deep-diff can't handle
                // comparisons of arrays
                if (Array.isArray(newPresent)){
                    newPresent[`${WRAPKEY}`] = newPresent;
                }

                for (let i = 0; i < lastChange.length; i++){
                    diff.applyChange(newPresent, true, lastChange[i]);
                }

                return {
                    past: [...past, lastChange],
                    present: Array.isArray(newPresent) ? newPresent[`${WRAPKEY}`] : newPresent,
                    future: newFuture
                }
            }
            default: {
                const newPresent = reducer(present, action);
                let actionDiff;

                // If state is an array, deep-diff can't handle
                // comparing arrays, so we wrap the array in an object
                if (Array.isArray(newPresent)){
                    actionDiff = diff({
                        WRAPKEY: present
                    }, {
                        WRAPKEY: newPresent
                    });
                } else if (typeof newPresent === "object"){
                    actionDiff = diff(present, newPresent);
                }

                // If the action did not alter the state,
                // return the initial state
                if (typeof actionDiff === "undefined"){
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

export { UNDO, REDO };
export default undoable;