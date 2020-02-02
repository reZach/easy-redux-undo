import { createAction } from "@reduxjs/toolkit";
const diff = require("deep-diff").diff;

const UNDOSTR = "@@UNDO";
const REDOSTR = "@@REDO";
const UNDO = createAction(UNDOSTR);
const REDO = createAction(REDOSTR);

const defaultOptions = {
    maxHistory: 20
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
                
                let lastChange = past[past.length - 1];
                let newPast = past.slice(0, past.length - 1);

                // Need to call Object.assign because we use
                // obj destructuring above and the below method (.revertChange)
                // cannot modify an existing obj reference 
                let newPresent = Object.assign({}, present);
                for (let i = 0; i < lastChange.length; i++){
                    diff.revertChange(newPresent, true, lastChange[i]);
                }

                return {
                    past: newPast,
                    present: newPresent,
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

                let lastChange = future[0];
                let newFuture = future.slice(1);

                // Need to call Object.assign because we use
                // obj destructuring above and the below method (.applyChange)
                // cannot modify an existing obj reference 
                let newPresent = Object.assign({}, present);
                for (let i = 0; i < lastChange.length; i++){
                    diff.applyChange(newPresent, true, lastChange[i]);
                }

                return {
                    past: [...past, lastChange],
                    present: newPresent,
                    future: newFuture
                }
            }
            default: {                
                const newPresent = reducer(present, action);
                let actionDiff;

                if (Array.isArray(newPresent)){

                    // We can only compare arrays if they stay in place
                    // and do not switch indecees. With this assumption,
                    // let's compare each element
                    // for (let i = 0; i < newPresent.length; i++){
                    //     for (let j = 0; j < present.length; j++){
                    //         if (i !== j){
                    //             actionDiff = diff(present[j], newPresent[i]);


                    //         }
                    //     }
                        
                    //     if (typeof actionDiff )
                    // }

                    
                } else if (typeof newPresent === "object"){
                    actionDiff = diff(present, newPresent);

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
}

export { UNDO, REDO };
export default undoable;