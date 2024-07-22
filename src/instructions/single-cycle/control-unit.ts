import type { OpcodeField } from '../fields/opcode-field';
import type Instruction from '../instruction';

export class ControlUnitDecoder {
    private readonly instruction: Instruction;
    readonly MemToReg : string;
    readonly MemWrite : string;
    readonly Branch : string;
    readonly ALUControl : string;
    readonly ALUSrc : string;
    readonly RegDst : string;
    readonly RegWrite : string;

    constructor(instruction: Instruction) {
      this.instruction = instruction;
      this.MemToReg = instruction.
    }

}