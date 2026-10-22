export const monthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const cells: Date[] = []
  for (
    let d = new Date(year, month, 1 - first.getDay());
    d <= last || d.getDay() !== 0;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    cells.push(d)
  }
  return cells
}
