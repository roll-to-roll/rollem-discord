export function humanizeInteger(x: number) {
  return Math.floor(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}