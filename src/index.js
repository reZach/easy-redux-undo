const UNDO = "@@UNDO";
const REDO = "@@REDO";

const undoable = function (reducer) {

    // return a reducer that handles undo and redo
    return function (state = {}, action) {
        const { past, present, future } = state;

        switch (action.type) {
            case UNDO:

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
            break;
        }
    }
}