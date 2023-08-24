export const formHeaders = (
  headers: {
    name: string
    value: string
  }[],
) =>
  headers.reduce((acc, cur) => {
    if (cur.name && cur.value) acc.append(cur.name, cur.value)
    return acc
  }, new Headers())
