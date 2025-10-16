function toto_narrow(input: string | number | string[] | number[]) {
  if (Array.isArray(input)) {
    if (is_str_array(input)) {
      input.push("je suis une chaîne supplémentaire");
      return null;
    } else {
      input.push(input.reduce((acc, curr) => acc + curr, 0));
      return null;
    }
  } else {
    if (typeof input === "number") {
     return input + 12;
    } else {
      return input.concat(" bonjour!");
    }
  }
}

function is_str_array(x: any[]): x is string[] {
  return !x.find((elem) => typeof elem !== "string");
}
