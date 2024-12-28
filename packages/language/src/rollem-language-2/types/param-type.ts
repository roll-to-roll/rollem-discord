// references
// on conditional subtypes https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
// on readonly detection https://stackoverflow.com/questions/49579094/typescript-conditional-types-filter-out-readonly-properties-pick-only-requir

/** For generating parameter types for containers. */
export type ParamType<T> = Omit<ExceptOfType<T, Function>, "depth" | "dice">;

/** A test class. */
class Test {
  public one = "one";
  public depth = 2;
  dice() { return 5; }

  constructor(input: ExceptOfType<Test, Function>) {
    this.one = input.one;
    this.depth = input.depth;
  }

  public static test() {
    return new Test({
      depth: 2,
      one: "one",
    })
  }
}



/** Constructs valid object depending on condition. */
export type ExceptOfType<Base, Condition> = Pick<Base, ExceptOfTypeAllowedKeys<Base, Condition>>;

/** Constructs valid object depending on condition. */
export type OnlyOfType<Base, Condition> = Pick<Base, OnlyOfTypeAllowedKeys<Base, Condition>>;

/** Selects valid Keys depending on condition. */
type ExceptOfTypeAllowedKeys<Base, Condition> = ExceptOfTypeFilter<Base, Condition>[keyof Base];

/** Selects valid Keys depending on condition. */
type OnlyOfTypeAllowedKeys<Base, Condition> = OnlyOfTypeFilter<Base, Condition>[keyof Base];

/** Sets Base[Key] types to `never` depending on condition. */
type OnlyOfTypeFilter<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
}

/** Sets Base[Key] types to `never` depending on condition. */
type ExceptOfTypeFilter<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? never : Key;
}

type IfEquals<X, Y, A=X, B=never> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? A : B;

type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T];

type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T];