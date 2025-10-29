import "dotenv/config";
import { Repository } from "./db.js";

const repo = new Repository();

try {
  repo.sync();
  console.log(
    await repo.createUserAuth({
      user_auth_login: "abc",
      user_auth_password: "def",
    }),
  );
  console.log(
    await repo.loginUserAuth({
      user_auth_login: "abc",
      user_auth_password: "def",
    }),
  );
  console.log(await repo.readAllUserAuth());
  console.log(await repo.readUserAuthById(5));
  console.log(
    await repo.updateUserAuthById(5, {
      user_auth_login: "def",
      user_auth_password: "abc",
    }),
  );
  console.log(await repo.updateUserAuthById(5, { user_auth_login: "abc" }));
  console.log(await repo.deleteUserAuthById(5));
} catch (err) {
  console.log(err);
}

repo.end();
