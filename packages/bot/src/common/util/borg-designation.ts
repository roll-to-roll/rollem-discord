export class BorgName {
  /** `7-of-9` */
  public static indexOfCount(index: number, count: number) {
    index += 1;
    return index === 1 && count === 1 ? 'only' : `${index}-of-${count}`;
    
  }

  /** `7-of-9 (x16)` */
  public static indexOfCountForGroup(index: number, count: number, multiplier: number) {
    const forGroup = multiplier === 1 ? '' : ` (x${multiplier})`;
    return this.indexOfCount(index, count) + forGroup;
  }
}