function plain(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

export { plain };
