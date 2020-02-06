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
  groupEndType: GROUPENDACTION
};

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

  if (changesToApply === GROUPENDACTION) {
    var startIndex = endIndex - 1;

    for (startIndex; startIndex >= 0; startIndex--) {
      if (newPast[startIndex] === GROUPBEGINACTION) break;
    }

    if (startIndex === 0 && newPast[startIndex] !== GROUPBEGINACTION) {
      throw "".concat(DEBUGPREPEND, " did not find a closed group of actions to undo, did you forget to send a '").concat(GROUPBEGINACTION, "' action?");
    }

    changesToApply = newPast.slice(startIndex + 1, endIndex);
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
    for (var i = 0; i < changesToApply.length; i++) {
      diff.revertChange(newPresent, true, changesToApply[i]);
    }
  }

  newPresent = Array.isArray(newPresent) ? newPresent["".concat(WRAPKEY)] : newPresent;

  if (undoingGroup) {
    newFuture = [GROUPBEGINACTION].concat(_toConsumableArray(changesToApply), [GROUPENDACTION], _toConsumableArray(newFuture));
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

  if (changeToApply === GROUPBEGINACTION) {
    for (startIndex; startIndex <= newFuture.length; startIndex++) {
      if (newFuture[startIndex] === GROUPENDACTION) break;
    }

    if (startIndex === newFuture.length - 1 && newFuture[startIndex] !== GROUPENDACTION) {
      throw "".concat(DEBUGPREPEND, " did not find a closed group of actions to redo, something must have went wrong!");
    }

    changesToApply = newFuture.slice(0, startIndex);
    startIndex = startIndex + 1;
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
    for (var i = 0; i < changesToApply.length; i++) {
      diff.applyChange(newPresent, true, changesToApply[i]);
    }
  }

  newPresent = Array.isArray(newPresent) ? newPresent["".concat(WRAPKEY)] : newPresent;

  if (redoingGroup) {
    newPast = [].concat(_toConsumableArray(newPast), [GROUPBEGINACTION], _toConsumableArray(changesToApply), [GROUPENDACTION]);
  } else {
    newPast = [].concat(_toConsumableArray(newPast), [changesToApply]);
  }

  return {
    past: newPast,
    present: newPresent,
    future: newFuture
  };
};

var undoable = function undoable(reducer) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  options = Object.assign(defaultOptions, options);
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
            past: [].concat(_toConsumableArray(past), [GROUPBEGINACTION]),
            present: present,
            future: future
          };
        }

      case options.groupEndType:
        {
          if (past[past.length - 1] === GROUPBEGINACTION) {
            console.warn("".concat(DEBUGPREPEND, " did not add '").concat(GROUPENDACTION, "' action; detected that the previous action was '").concat(GROUPBEGINACTION, "' - this would result in an empty group!"));
            break;
          } else {
            return {
              past: [].concat(_toConsumableArray(past), [GROUPENDACTION]),
              present: present,
              future: future
            };
          }
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

          var result = {};

          for (var i = 1; i <= actionCount; i++) {
            result = undo(past, present, future, result.past, result.present, result.future);
            if (result.past.length === 0) break;
          }

          return result;
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

          var _result = {};

          for (var _i = 1; _i <= actionCount; _i++) {
            _result = redo(past, present, future, _result.past, _result.present, _result.future);
            if (_result.past.length === 0) break;
          }

          return _result;
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

          return {
            past: [].concat(_toConsumableArray(past.slice(past.length === options.maxHistory ? 1 : 0)), [actionDiff]),
            present: newPresent,
            future: []
          };
        }
    }
  };
};

var _default = undoable;
exports["default"] = _default;