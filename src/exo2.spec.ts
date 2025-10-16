import { expect, test } from "vitest";
import {
  type User,
  users_add,
  users_get,
  users_logins,
  users_names_by_birth_year,
} from "./exo2.js";

test("users_add", () => {
  let users: User[] = [];
  users_add(users, { name: "abc", login: "def", yob: 1 });
  expect(users.length).toEqual(1);
  expect(users[0]).toEqual({ id: 1, name: "abc", login: "def", yob: 1 });
  users_add(users, { name: "abc", login: "def", yob: 1 });
  expect(users.length).toEqual(2);
  expect(users[1]).toEqual({ id: 2, name: "abc", login: "def", yob: 1 });
  users = [users[1]];
  users_add(users, { name: "abc", login: "def", yob: 1 });
  expect(users.length).toEqual(2);
  expect(users[1]).toEqual({ id: 3, name: "abc", login: "def", yob: 1 });
});

test("users_get", () => {
  const users: User[] = [];
  users_add(users, { name: "", login: "a", yob: 1 });
  users_add(users, { name: "", login: "b", yob: 1 });
  users_add(users, { name: "", login: "c", yob: 1 });
  users_add(users, { name: "", login: "1", yob: 1 });
  expect(users_get(users, 1)).toEqual({ id: 1, name: "", login: "a", yob: 1 });
  expect(users_get(users, "1")).toEqual({
    id: 4,
    name: "",
    login: "1",
    yob: 1,
  });
  expect(users_get(users, "b")).toEqual({
    id: 2,
    name: "",
    login: "b",
    yob: 1,
  });
  expect(users_get(users, 0)).toBeNull();
});

test("users_logins", () => {
  const users: User[] = [];
  users_add(users, { name: "", login: "a", yob: 1 });
  users_add(users, { name: "", login: "b", yob: 1 });
  users_add(users, { name: "", login: "c", yob: 1 });
  expect(users_logins(users)).toEqual(["a", "b", "c"]);
});

test("users_names_by_birth_year", () => {
  const users: User[] = [];
  users_add(users, { name: "a", login: "", yob: 3 });
  users_add(users, { name: "b", login: "", yob: 4 });
  users_add(users, { name: "c", login: "", yob: 1 });
  users_add(users, { name: "d", login: "", yob: 3 });
  expect(users_names_by_birth_year(users)).toEqual([
    { name: "c", yob: 1 },
    { name: "a", yob: 3 },
    { name: "d", yob: 3 },
    { name: "b", yob: 4 },
  ]);
});
