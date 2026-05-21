export const typeDefs = `#graphql

  # ───── Типы данных ─────

  type Author {
    id: ID!
    name: String!
    bio: String

    # Вложенное поле — список книг этого автора.
    # Резолвер Author.books вычислит его динамически.
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    genre: String!
    year: Int!

    # Вложенное поле — объект автора.
    # Резолвер Book.author вычислит его по authorId.
    author: Author!
  }

  # ───── Input-типы для мутаций ─────
  # Удобно группировать аргументы в один объект вместо длинного списка

  input CreateAuthorInput {
    name: String!
    bio: String
  }

  input CreateBookInput {
    title: String!
    genre: String!
    year: Int!
    authorId: ID!
  }

  # ───── Корневые типы ─────

  type Query {
    # Получить список всех книг
    books: [Book!]!

    # Получить одну книгу по id (может вернуть null, если не найдена)
    book(id: ID!): Book

    # Получить список всех авторов
    authors: [Author!]!

    # Получить одного автора по id
    author(id: ID!): Author
  }

  type Mutation {
    # Создать нового автора
    createAuthor(input: CreateAuthorInput!): Author!

    # Создать новую книгу
    createBook(input: CreateBookInput!): Book!
  }
`;