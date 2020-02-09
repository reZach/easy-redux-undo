"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.GROUPEND = exports.GROUPBEGIN = exports.CLEAR = exports.REDO = exports.UNDO = void 0;

var _toolkit = require("@reduxjs/toolkit");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var _ = require("lodash");

var diff = require("deep-diff").diff;

var WRAPKEY = "__wrapper";
var DEBUGPREPEND = "[easy-redux-undo]=>";
var LIBRARYPREFIX = "@@easy-redux-undo/";
var UNDOACTION = "".concat(LIBRARYPREFIX, "UNDO");
var REDOACTION = "".concat(LIBRARYPREFIX, "REDO");
var CLEARACTION = "".concat(LIBRARYPREFIX, "CLEAR");
var GROUPBEGINACTION = "".concat(LIBRARYPREFIX, "GROUPBEGIN");
var GROUPENDACTION = "".concat(LIBRARYPREFIX, "GROUPEND");
var UNDO = (0, _toolkit.createAction)(UNDOACTION);
exports.UNDO = UNDO;
var REDO = (0, _toolkit.createAction)(REDOACTION);
exports.REDO = REDO;
var CLEAR = (0, _toolkit.createAction)(CLEARACTION);
exports.CLEAR = CLEAR;
var GROUPBEGIN = (0, _toolkit.createAction)(GROUPBEGINACTION);
exports.GROUPBEGIN = GROUPBEGIN;
var GROUPEND = (0, _toolkit.createAction)(GROUPENDACTION);
exports.GROUPEND = GROUPEND;
var defaultOptions = {
  maxHistory: 100,
  undoType: UNDOACTION,
  redoType: REDOACTION,
  clearType: CLEARACTION,
  groupBeginType: GROUPBEGINACTION,
  groupEndType: GROUPENDACTION,
  include: [],
  exclude: []
};

var undoable = function undoable(reducer) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  options = Object.assign(defaultOptions, options);

  var undo = function undo(past, present, future) {
    var updPast = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
    var updPresent = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
    var updFuture = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;
    var newPast = !!updPast ? updPast : past;
    var newPresent;
    var newFuture = !!updFuture ? updFuture : future;
    var undoingGroup = false;
    var endIndex = newPast.length - 1;
    var changesToApply = newPast[endIndex];

    if (changesToApply === options.groupEndType) {
      var startIndex = endIndex - 1;

      for (startIndex; startIndex >= 0; startIndex--) {
        if (newPast[startIndex] === options.groupBeginType) break;
      }

      if (startIndex === 0 && newPast[startIndex] !== options.groupBeginType) {
        throw "".concat(DEBUGPREPEND, " did not find a closed group of actions to undo, did you forget to send a '").concat(options.groupBeginType, "' action?");
      }

      changesToApply = [];

      for (var i = endIndex - 1; i >= startIndex + 1; i--) {
        changesToApply.push(newPast[i]);
      }

      endIndex = startIndex;
      undoingGroup = true;
    }

    newPast = newPast.slice(0, endIndex);
    newPresent = !!updPresent ? updPresent : _.cloneDeep(present);

    if (Array.isArray(newPresent)) {
      newPresent["".concat(WRAPKEY)] = newPresent;
    }

    if (undoingGroup) {
      for (var j = 0; j < changesToApply.length; j++) {
        for (var k = 0; k < changesToApply[j].length; k++) {
          diff.revertChange(newPresent, true, changesToApply[j][k]);
        }
      }
    } else {
      for (var _i = 0; _i < changesToApply.length; _i++) {
        diff.revertChange(newPresent, true, changesToApply[_i]);
      }
    }

    newPresent = Array.isArray(newPresent) ? newPresent["".concat(WRAPKEY)] : newPresent;

    if (undoingGroup) {
      newFuture = [options.groupEndType].concat(_toConsumableArray(changesToApply), [options.groupBeginType], _toConsumableArray(newFuture));
    } else {
      newFuture = [changesToApply].concat(_toConsumableArray(newFuture));
    }

    return {
      past: newPast,
      present: newPresent,
      future: newFuture
    };
  };

  var redo = function redo(past, present, future) {
    var updPast = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
    var updPresent = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
    var updFuture = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;
    var newPast = !!updPast ? updPast : past;
    var newPresent;
    var newFuture = !!updFuture ? updFuture : future;
    var redoingGroup = false;
    var startIndex = 1;
    var changesToApply = newFuture[startIndex - 1];

    if (changesToApply === options.groupEndType) {
      var endIndex = startIndex;

      for (endIndex; endIndex <= newFuture.length; endIndex++) {
        if (newFuture[endIndex] === options.groupBeginType) break;
      }

      if (endIndex === newFuture.length - 1 && newFuture[endIndex] !== options.groupBeginType) {
        throw "".concat(DEBUGPREPEND, " did not find a closed group of actions to redo, something must have went wrong!");
      }

      changesToApply = [];

      for (var i = endIndex - 1; i >= startIndex; i--) {
        changesToApply.push(newFuture[i]);
      }

      startIndex = endIndex + 1;
      redoingGroup = true;
    }

    newFuture = newFuture.slice(startIndex);
    newPresent = !!updPresent ? updPresent : _.cloneDeep(present);

    if (Array.isArray(newPresent)) {
      newPresent["".concat(WRAPKEY)] = newPresent;
    }

    if (redoingGroup) {
      for (var j = 0; j < changesToApply.length; j++) {
        for (var k = 0; k < changesToApply[j].length; k++) {
          diff.applyChange(newPresent, true, changesToApply[j][k]);
        }
      }
    } else {
      for (var _i2 = 0; _i2 < changesToApply.length; _i2++) {
        diff.applyChange(newPresent, true, changesToApply[_i2]);
      }
    }

    newPresent = Array.isArray(newPresent) ? newPresent["".concat(WRAPKEY)] : newPresent;

    if (redoingGroup) {
      newPast = [].concat(_toConsumableArray(newPast), [options.groupBeginType], _toConsumableArray(changesToApply), [options.groupEndType]);
    } else {
      newPast = [].concat(_toConsumableArray(newPast), [changesToApply]);
    }

    return {
      past: newPast,
      present: newPresent,
      future: newFuture
    };
  };

  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var action = arguments.length > 1 ? arguments[1] : undefined;
    var past = state.past,
        present = state.present,
        future = state.future;

    if (typeof present === "undefined") {
      return {
        past: [],
        present: reducer(undefined, {}),
        future: []
      };
    }

    var actionCount = typeof action.payload === "number" && action.payload > 0 ? action.payload : 1;

    switch (action.type) {
      case options.groupBeginType:
        {
          return {
            past: [].concat(_toConsumableArray(past), [options.groupBeginType]),
            present: present,
            future: future
          };
        }

      case options.groupEndType:
        {
          if (past[past.length - 1] === options.groupBeginType) {
            console.warn("".concat(DEBUGPREPEND, " did not add '").concat(options.groupEndType, "' action; detected that the previous action was '").concat(options.groupBeginType, "' - this would result in an empty group!"));
            break;
          } else {
            return {
              past: [].concat(_toConsumableArray(past), [options.groupEndType]),
              present: present,
              future: future
            };
          }
        }

      case options.clearType:
        {
          return {
            past: [],
            present: present,
            future: []
          };
        }

      case options.undoType:
        {
          if (past.length === 0) {
            return {
              past: past,
              present: present,
              future: future
            };
          }

          var undoResult = {};

          for (var i = 1; i <= actionCount; i++) {
            undoResult = undo(past, present, future, undoResult.past, undoResult.present, undoResult.future);
            if (undoResult.past.length === 0) break;
          }

          return undoResult;
        }

      case options.redoType:
        {
          if (future.length === 0) {
            return {
              past: past,
              present: present,
              future: future
            };
          }

          var redoResult = {};

          for (var _i3 = 1; _i3 <= actionCount; _i3++) {
            redoResult = redo(past, present, future, redoResult.past, redoResult.present, redoResult.future);
            if (redoResult.past.length === 0) break;
          }

          return redoResult;
        }

      default:
        {
          var newPresent = reducer(present, action);
          var actionDiff;

          if (Array.isArray(newPresent)) {
            actionDiff = diff({
              WRAPKEY: present
            }, {
              WRAPKEY: newPresent
            });
          } else if (_typeof(newPresent) === "object") {
            actionDiff = diff(present, newPresent);
          }

          if (typeof actionDiff === "undefined") {
            return state;
          }

          var totalHistory = 0;
          var inGroup = false;
          var newPast = [actionDiff];

          for (var _i4 = past.length - 1; _i4 >= 0; _i4--) {
            if (past[_i4] === options.groupEndType) break;

            if (past[_i4] === options.groupBeginType) {
              inGroup = true;
              break;
            }
          }

          for (var _i5 = past.length - 1; _i5 >= 0; _i5--) {
            if (past[_i5] === options.groupEndType) {
              totalHistory = totalHistory + 1;
              inGroup = true;
            } else if (past[_i5] === options.groupBeginType) {
              inGroup = false;
            } else if (!inGroup) totalHistory = totalHistory + 1;

            if (totalHistory >= options.maxHistory - 1 || _i5 === 0) {
              if (past[_i5] === options.groupEndType) {
                var j = _i5;

                for (j; j >= 0; j--) {
                  if (past[j] === options.groupBeginType) {
                    break;
                  }
                }

                newPast = [].concat(_toConsumableArray(past.slice(j)), [actionDiff]);
              } else {
                newPast = [].concat(_toConsumableArray(past.slice(_i5)), [actionDiff]);
              }

              break;
            }
          }

          return {
            past: newPast,
            present: newPresent,
            future: []
          };
        }
    }
  };
};

var _default = undoable;
exports["default"] = _default;