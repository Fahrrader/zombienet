"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLogTable = exports.setSilent = void 0;
const cli_table3_1 = __importDefault(require("cli-table3"));
const chars = {
    top: "═",
    "top-mid": "╤",
    "top-left": "╔",
    "top-right": "╗",
    bottom: "═",
    "bottom-mid": "╧",
    "bottom-left": "╚",
    "bottom-right": "╝",
    left: "║",
    "left-mid": "╟",
    mid: "─",
    "mid-mid": "┼",
    right: "║",
    "right-mid": "╢",
    middle: "│",
};
// Module level config.
let silent = true;
function setSilent(value) {
    silent = value;
}
exports.setSilent = setSilent;
class CreateLogTable {
    constructor({ head, colWidths, doubleBorder, wordWrap }) {
        this.pushTo = (inputs) => {
            Array.isArray(inputs) &&
                inputs.forEach((input) => {
                    Array.isArray(input) &&
                        input.forEach((inp, index) => {
                            const split = this.colWidths[index] - 10;
                            const times = parseInt((inp.length / split).toString());
                            if (times > 1) {
                                const some = inp;
                                for (let i = 0; i <= times; i++) {
                                    if (i === 0) {
                                        inp = some.substring(0, split);
                                    }
                                    else {
                                        inp += "\n" + some.substring(split * i, split * (i + 1));
                                    }
                                }
                                input[index] = inp;
                            }
                        });
                    this.table.push(input);
                });
        };
        this.print = () => {
            if (!silent)
                console.log(this.table.toString());
        };
        // This function makes the process of creating a table, pushing data and printing it faster
        // It is meant to exist in order to reduce the log lines in the code
        this.pushToPrint = (inputs) => {
            this.pushTo(inputs);
            this.print();
        };
        this.wordWrap = wordWrap || false;
        this.colWidths = colWidths;
        const params = { colWidths, wordWrap };
        if (head === null || head === void 0 ? void 0 : head.length)
            params.head = head;
        if (doubleBorder) {
            params.chars = chars;
        }
        this.table = new cli_table3_1.default(params);
    }
}
exports.CreateLogTable = CreateLogTable;
