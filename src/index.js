import {
    createAction
} from "@reduxjs/toolkit";
const _ = require("lodash");
const diff = require("deep-diff").diff;

const WRAPKEY = "__wrapper";
const DEBUGPREPEND = "[easy-redux-undo]=>";
const LIBRARYPREFIX = "@@easy-redux-undo/";
const UNDOACTION = `${LIBRARYPREFIX}UNDO`;
const REDOACTION = `${LIBRARYPREFIX}REDO`;
const CLEARACTION = `${LIBRARYPREFIX}CLEAR`;
const GROUPBEGINACTION = `${LIBRARYPREFIX}GROUPBEGIN`;
const GROUPENDACTION = `${LIBRARYPREFIX}GROUPEND`;
const UNDO = createAction(UNDOACTION);
const REDO = createAction(REDOACTION);
const CLEAR = createAction(CLEARACTION);
const GROUPBEGIN = createAction(GROUPBEGINACTION);
const GROUPEND = createAction(GROUPENDACTION);

const defaultOptions = {
    maxHistory: 100,
    undoType: UNDOACTION,
    redoType: REDOACTION,
    clearType: CLEARACTION,
    groupBeginType: GROUPBEGINACTION,
    groupEndType: GROUPENDACTION
};


const undoable = function (reducer, options = {}) {
    options = Object.assign(defaultOptions, options);

    /** @description Undos an action in the store, or a group of actions if undo encounters a group
     * @returns {object} An object of the updated state in the store
     * @param {object} past 
     * @param {object} present 
     * @param {object} future 
     * @param {object} updPast The previous past from a prior undo call, if calling undo for the first time, this value should be undefined
     * @param {object} updPresent The previous present from a prior undo call, if calling undo for the first time, this value should be undefined
     * @param {object} updFuture The previous future from a prior undo call, if calling undo for the first time, this value should be undefined
     */
    const undo = function (past, present, future, updPast = undefined, updPresent = undefined, updFuture = undefined) {        
        let newPast = !!updPast ? updPast : past;
        let newPresent;
        let newFuture = !!updFuture ? updFuture : future;
        let undoingGroup = false;

        let endIndex = newPast.length - 1;
        let changesToApply = newPast[endIndex];

        // If we are undoing a group,
        // grab all actions in that group
        if (changesToApply === options.groupEndType) {
            let startIndex = endIndex - 1;

            // Find the matching group begin action
            for (startIndex; startIndex >= 0; startIndex--) {
                if (newPast[startIndex] === options.groupBeginType) break;
            }

            // Throw if didn't find closed group
            if (startIndex === 0 && newPast[startIndex] !== options.groupBeginType) {
                throw `${DEBUGPREPEND} did not find a closed group of actions to undo, did you forget to send a '${options.groupBeginType}' action?`;
            }

            // Store all changes as part of this group to undo
            changesToApply = [];
            for (let i = endIndex - 1; i >= startIndex + 1; i--){
                changesToApply.push(newPast[i]);
            }

            // Update the endIndex variable so we can make use of
            // it outside of this 'if' statement
            endIndex = startIndex;

            undoingGroup = true;
        }

        // Store the new past after we undo the given action/s
        newPast = newPast.slice(0, endIndex);

        // Need to deep clone here because otherwise the
        // 'diff' function below complains because we can't edit
        // the redux store values directly
        newPresent = !!updPresent ? updPresent : _.cloneDeep(present);

        // Need to wrap present in object if state is
        // an array, because deep-diff can't handle
        // comparisons of arrays
        if (Array.isArray(newPresent)) {
            newPresent[`${WRAPKEY}`] = newPresent;
        }

        // Revert the changes applied to the state
        if (undoingGroup) {
            for (let j = 0; j < changesToApply.length; j++) {
                for (let k = 0; k < changesToApply[j].length; k++) {
                    diff.revertChange(newPresent, true, changesToApply[j][k]);
                }
            }
        } else {
            for (let i = 0; i < changesToApply.length; i++) {
                diff.revertChange(newPresent, true, changesToApply[i]);
            }
        }

        // Unwrap array if state is an array
        newPresent = Array.isArray(newPresent) ? newPresent[`${WRAPKEY}`] : newPresent;

        // Update the future array
        if (undoingGroup) {
            newFuture = [options.groupEndType, ...changesToApply, options.groupBeginType, ...newFuture];
        } else {
            newFuture = [changesToApply, ...newFuture];
        }

        return {
            past: newPast,
            present: newPresent,
            future: newFuture
        }
    }

    /** @description Redos an action in the store, or a group of actions if redo encounters a group
     * @returns {object} An object of the updated state in the store
     * @param {object} past 
     * @param {object} present 
     * @param {object} future 
     * @param {object} updPast The previous past from a prior redo call, if calling redo for the first time, this value should be undefined
     * @param {object} updPresent The previous present from a prior redo call, if calling redo for the first time, this value should be undefined
     * @param {object} updFuture The previous future from a prior redo call, if calling redo for the first time, this value should be undefined
     */
    const redo = function (past, present, future, updPast = undefined, updPresent = undefined, updFuture = undefined) {
        let newPast = !!updPast ? updPast : past;
        let newPresent;
        let newFuture = !!updFuture ? updFuture : future;
        let redoingGroup = false;

        let startIndex = 1;
        let changesToApply = newFuture[startIndex - 1];

        // If we are undoing a group,
        // grab all actions in that group
        if (changesToApply === options.groupEndType) {

            let endIndex = startIndex;
            // Find the matching group begin action
            for (endIndex; endIndex <= newFuture.length; endIndex++) {
                if (newFuture[endIndex] === options.groupBeginType) break;
            }

            // Throw if didn't find closed group
            if (endIndex === newFuture.length - 1 && newFuture[endIndex] !== options.groupBeginType) {
                throw `${DEBUGPREPEND} did not find a closed group of actions to redo, something must have went wrong!`;
            }

            // Store all changes as part of this group to undo
            changesToApply = [];
            for (let i = endIndex - 1; i >= startIndex; i--){
                changesToApply.push(newFuture[i]);
            }

            // Update the startIndex variable so we can make use of
            // it outside of this 'if' statement
            startIndex = endIndex + 1;

            redoingGroup = true;
        }

        // Update future array
        newFuture = newFuture.slice(startIndex);

        // Need to deep clone here because otherwise the
        // 'diff' function below complains because we can't edit
        // the redux store values directly
        newPresent = !!updPresent ? updPresent : _.cloneDeep(present);

        // Need to wrap present in object if state is
        // an array, because deep-diff can't handle
        // comparisons of arrays
        if (Array.isArray(newPresent)) {
            newPresent[`${WRAPKEY}`] = newPresent;
        }

        // Revert the changes applied to the state
        if (redoingGroup) {
            for (let j = 0; j < changesToApply.length; j++) {
                for (let k = 0; k < changesToApply[j].length; k++) {
                    diff.applyChange(newPresent, true, changesToApply[j][k]);
                }
            }
        } else {
            for (let i = 0; i < changesToApply.length; i++) {
                diff.applyChange(newPresent, true, changesToApply[i]);
            }
        }

        // Unwrap array if state is an array
        newPresent = Array.isArray(newPresent) ? newPresent[`${WRAPKEY}`] : newPresent;

        // Update the past array
        if (redoingGroup) {
            newPast = [...newPast, options.groupBeginType, ...changesToApply, options.groupEndType];
        } else {
            newPast = [...newPast, changesToApply];
        }

        return {
            past: newPast,
            present: newPresent,
            future: newFuture
        }
    }

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
            case options.groupBeginType: {
                return {
                    past: [...past, GROUPBEGINACTION],
                    present,
                    future
                };
            }
            case options.groupEndType: {
                if (past[past.length - 1] === GROUPBEGINACTION) {
                    console.warn(`${DEBUGPREPEND} did not add '${GROUPENDACTION}' action; detected that the previous action was '${GROUPBEGINACTION}' - this would result in an empty group!`);
                    break;
                } else {
                    return {
                        past: [...past, GROUPENDACTION],
                        present,
                        future
                    };
                }
            }
            case options.undoType: {
                if (past.length === 0) {
                    return {
                        past,
                        present,
                        future
                    };
                }

                let result = {};
                for (let i = 1; i <= actionCount; i++) {
                    result = undo(past, present, future, result.past, result.present, result.future);

                    if (result.past.length === 0) break;
                }

                return result;
            }
            case options.redoType: {
                if (future.length === 0) {
                    return {
                        past,
                        present,
                        future
                    };
                }

                let result = {};
                for (let i = 1; i <= actionCount; i++) {
                    result = redo(past, present, future, result.past, result.present, result.future);

                    if (result.past.length === 0) break;
                }

                return result;
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
    CLEAR,
    GROUPBEGIN,
    GROUPEND
};
export default undoable;