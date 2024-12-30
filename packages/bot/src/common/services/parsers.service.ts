import { RollemParserV1, RollemParserV1Beta, RollemParserV2 } from "@rollem/language";
import { Injectable } from "injection-js";

@Injectable()
export class Parsers {
  constructor(
    public readonly v1: RollemParserV1,
    public readonly v1beta: RollemParserV1Beta,
    public readonly v2: RollemParserV2,
  ) { }
}