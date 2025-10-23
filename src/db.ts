import postgres from "postgres";

export class Repository {
  sql: postgres.Sql;

  constructor() {
    this.sql = postgres();
  }
  async end() {
    return this.sql.end();
  }
}
