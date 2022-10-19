import { PartialType } from "@nestjs/swagger";
import { CreateCustomerNoteDto } from "./create-customer-note.dto";

export class UpdateCustomerNoteDto extends PartialType(CreateCustomerNoteDto) { }
