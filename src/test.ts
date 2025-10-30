import "dotenv/config";
import { Repository } from "./db.js";

const repo = new Repository();

try {
  const res = await repo.createUserAuth({
    user_auth_login: "abc",
    user_auth_password: "def",
  });
  console.log("createUserAuth: ", res);
  const id = res[0].user_auth_id;
  console.log(
    "loginUserAuth: ",
    await repo.loginUserAuth({
      user_auth_login: "abc",
      user_auth_password: "def",
    }),
  );
  console.log("readAllUserAuth: ", await repo.readAllUserAuth());
  console.log("readUserAuth: ", await repo.readUserAuthById(id));
  console.log(
    "updateUserAuth: ",
    await repo.updateUserAuthById(5, {
      user_auth_login: "def",
      user_auth_password: "abc",
    }),
  );
  console.log(
    "updateUserAuth: ",
    await repo.updateUserAuthById(5, { user_auth_login: "abc" }),
  );
  console.log(
    "createUserProfile: ",
    await repo.createUserProfile({
      user_profile_name: "tkt",
      user_profile_role: "super-admin",
      user_auth_id: 5,
    }),
  );
  console.log("readAllUserProfile: ", await repo.readAllUserProfile());
  console.log("readUserProfile: ", await repo.readUserProfileById(id));
  console.log(
    "updateUserProfile: ",
    await repo.updateUserProfileById(5, {
      user_profile_name: "tkt2",
      user_profile_role: "admin",
    }),
  );
  console.log("deleteUserProfile: ", await repo.deleteUserProfileById(id));
  console.log("deleteUserAuth: ", await repo.deleteUserAuthById(id));
} catch (err) {
  console.log(err);
}

repo.end();
