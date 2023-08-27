export function shuffle<T>(array: T[]): T[] {
  const clone = array.slice()
  let currentIndex = clone.length
  let tmp
  let randomIndex

  // While there remain elements to shuffle…
  while (currentIndex) {
    // Pick a remaining element…
    randomIndex = Math.floor(Math.random() * currentIndex--)

    // And swap it with the current element.
    tmp = clone[currentIndex]
    clone[currentIndex] = clone[randomIndex]
    clone[randomIndex] = tmp
  }

  return clone
}
