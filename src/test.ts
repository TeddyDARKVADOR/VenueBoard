import "dotenv/config";
import { Repository } from "./db.js";

const repo = new Repository();

const res = await repo.createUserAuth({
  user_auth_login: "abc",
  user_auth_password: "def",
});
console.log(res);

repo.end();
