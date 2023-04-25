import { Kysely, Generated } from "kysely";
import { LibsqlDialect, hrana } from "..";

interface BookTable {
    id: Generated<number>,
    title: string,
}

interface Database {
    book: BookTable,
}

test("it works", async () => {
    const client = hrana.open("ws://localhost:8080");
    const s = client.openStream();
    await s.run("CREATE TABLE book (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT)");
    s.close();

    const db = new Kysely<Database>({
        dialect: new LibsqlDialect({ client }),
    });

    const { id } = await db.insertInto("book")
        .values({ title: "Pride and Prejudice" })
        .returning("id")
        .executeTakeFirstOrThrow();

    const book = await db.selectFrom("book")
        .select(["id", "title"])
        .where("book.id", "=", id)
        .executeTakeFirst();

    expect(book!.id).toStrictEqual(id);
    expect(book!.title).toStrictEqual("Pride and Prejudice");

    await db.destroy();
    client.close();
});
