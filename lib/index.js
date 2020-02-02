"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.REDO = exports.UNDO = void 0;

var _toolkit = require("@reduxjs/toolkit");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var diff = require("deep-diff").diff;

var UNDOSTR = "@@UNDO";
var REDOSTR = "@@REDO";
var UNDO = (0, _toolkit.createAction)(UNDOSTR);
exports.UNDO = UNDO;
var REDO = (0, _toolkit.createAction)(REDOSTR);
exports.REDO = REDO;
var defaultOptions = {
  maxHistory: 20
};

var undoable = function undoable(reducer) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultOptions;
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

    switch (action.type) {
      case UNDOSTR:
        {
          if (past.length === 0) {
            return {
              past: past,
              present: present,
              future: future
            };
          }

          var lastChange = past[past.length - 1];
          var newPast = past.slice(0, past.length - 1);
          var newPresent = Object.assign({}, present);

          for (var i = 0; i < lastChange.length; i++) {
            diff.revertChange(newPresent, true, lastChange[i]);
          }

          return {
            past: newPast,
            present: newPresent,
            future: [lastChange].concat(_toConsumableArray(future))
          };
        }

      case REDOSTR:
        {
          if (future.length === 0) {
            return {
              past: past,
              present: present,
              future: future
            };
          }

          var _lastChange = future[0];
          var newFuture = future.slice(1);

          var _newPresent = Object.assign({}, present);

          for (var _i = 0; _i < _lastChange.length; _i++) {
            diff.applyChange(_newPresent, true, _lastChange[_i]);
          }

          return {
            past: [].concat(_toConsumableArray(past), [_lastChange]),
            present: _newPresent,
            future: newFuture
          };
        }

      default:
        {
          var _newPresent2 = reducer(present, action);

          var actionDiff;

          if (Array.isArray(_newPresent2)) {} else if (_typeof(_newPresent2) === "object") {
            actionDiff = diff(present, _newPresent2);

            if (typeof actionDiff === "undefined") {
              return state;
            }

            return {
              past: [].concat(_toConsumableArray(past.slice(past.length === options.maxHistory ? 1 : 0)), [actionDiff]),
              present: _newPresent2,
              future: []
            };
          }
        }
    }
  };
};

var _default = undoable;
exports["default"] = _default;