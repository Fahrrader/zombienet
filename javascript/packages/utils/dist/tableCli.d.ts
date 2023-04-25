import { CrossTableRow, GenericTable, HorizontalTableRow, VerticalTableRow } from "cli-table3";
type CharsObj = {
    [key in "top" | "top-mid" | "top-left" | "top-right" | "bottom" | "bottom-mid" | "bottom-left" | "bottom-right" | "left" | "left-mid" | "mid" | "mid-mid" | "right" | "right-mid" | "middle"]: string;
};
type CreatedTable = GenericTable<HorizontalTableRow | VerticalTableRow | CrossTableRow>;
interface TableCreationProps {
    colWidths: number[];
    head?: any[];
    doubleBorder?: boolean;
    chars?: CharsObj;
    wordWrap?: boolean;
}
export declare function setSilent(value: boolean): void;
export declare class CreateLogTable {
    table: CreatedTable | undefined;
    colWidths: number[];
    wordWrap: boolean;
    constructor({ head, colWidths, doubleBorder, wordWrap }: TableCreationProps);
    pushTo: (inputs: any[][]) => void;
    print: () => void;
    pushToPrint: (inputs: any[][]) => void;
}
export {};
