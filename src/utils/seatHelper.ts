export const generateSeatLayout = (rows: number, cols: number) => {
  const layout = []
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  for (let i = 0; i < rows; i++) {
    const row = []
    for (let j = 0; j < cols; j++) {
      row.push({
        code: `${alphabet[i]}${j + 1}`,
        type: 'normal',
      })
    }
    layout.push(row)
  }

  return layout
}
