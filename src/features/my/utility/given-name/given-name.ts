export const givenName = (name: string) =>
  /^[가-힣]{3}$/.test(name) ? name.slice(1) : name.slice(0, 2)
