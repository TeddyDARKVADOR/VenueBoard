type User = {
  id: number;
  name: string;
  login: string;
  yob: number;
};

function users_add(users: User[], user_without_id: Omit<User, "id">) {
  const next_id =
    users.reduce((biggest_id, curr) => {
      if (curr.id > biggest_id) {
        return curr.id;
      }
      return biggest_id;
    }, 0) + 1;
  users.push({ id: next_id, ...user_without_id });
}

function users_get(users: User[], input: User["id"] | User["login"]) {
  return (
    users.find((user) => input === user.id || input === user.login) ?? null
  );
}

function users_logins(users: User[]) {
  return users.map((user) => user.login);
}

function users_names_by_birth_year(users: User[]) {
  return users
    .sort((curr, prev) => curr.yob - prev.yob)
    .map((user) => {
      return { name: user.name, yob: user.yob };
    });
}
