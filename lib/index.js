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

var _ = require("lodash");

var diff = require("deep-diff").diff;

var WRAPKEY = "__wrapper";
var UNDOSTR = "@@easy-redux-undo/UNDO";
var REDOSTR = "@@easy-redux-undo/REDO";
var UNDO = (0, _toolkit.createAction)(UNDOSTR);
exports.UNDO = UNDO;
var REDO = (0, _toolkit.createAction)(REDOSTR);
exports.REDO = REDO;
var defaultOptions = {
  maxHistory: 100,
  undoType: UNDOSTR,
  redoType: REDOSTR
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
      case UNDOSTR:
        {
          if (past.length === 0) {
            return {
              past: past,
              present: present,
              future: future
            };
          }

          var lastChange;
          var newPast;
          var newPresent;
          var newFuture;

          for (var i = 1; i <= actionCount; i++) {
            lastChange = past[past.length - i];
            newPast = past.slice(0, past.length - i);
            newPresent = !!newPresent ? newPresent : _.cloneDeep(present);

            if (Array.isArray(newPresent)) {
              newPresent["".concat(WRAPKEY)] = newPresent;
            }

            for (var j = 0; j < lastChange.length; j++) {
              diff.revertChange(newPresent, true, lastChange[j]);
            }

            newPresent = Array.isArray(newPresent) ? newPresent["".concat(WRAPKEY)] : newPresent;
            newFuture = [lastChange].concat(_toConsumableArray(!!newFuture ? newFuture : future));
            if (newPast.length === 0) break;
          }

          return {
            past: newPast,
            present: newPresent,
            future: newFuture
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

          var _lastChange;

          var _newPast;

          var _newPresent;

          var _newFuture;

          for (var _i = 1; _i <= actionCount; _i++) {
            _lastChange = future[_i - 1];
            _newFuture = future.slice(_i);
            _newPresent = !!_newPresent ? _newPresent : _.cloneDeep(present);

            if (Array.isArray(_newPresent)) {
              _newPresent["".concat(WRAPKEY)] = _newPresent;
            }

            for (var k = 0; k < _lastChange.length; k++) {
              diff.applyChange(_newPresent, true, _lastChange[k]);
            }

            _newPresent = Array.isArray(_newPresent) ? _newPresent["".concat(WRAPKEY)] : _newPresent;
            _newPast = [].concat(_toConsumableArray(!!_newPast ? _newPast : past), [_lastChange]);
            if (_newFuture.length === 0) break;
          }

          return {
            past: _newPast,
            present: _newPresent,
            future: _newFuture
          };
        }

      default:
        {
          var _newPresent2 = reducer(present, action);

          var actionDiff;

          if (Array.isArray(_newPresent2)) {
            actionDiff = diff({
              WRAPKEY: present
            }, {
              WRAPKEY: _newPresent2
            });
          } else if (_typeof(_newPresent2) === "object") {
            actionDiff = diff(present, _newPresent2);
          }

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
  };
};

var _default = undoable;
exports["default"] = _default;