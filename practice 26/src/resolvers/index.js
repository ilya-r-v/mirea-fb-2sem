import { authors, books } from '../data/store.js';

export const resolvers = {
  Query: {
    books: () => books,

    book: (_, { id }) => {
      const book = books.find(b => b.id === id);
      if (!book) return null;
      return book;
    },

    authors: () => authors,

    author: (_, { id }) => authors.find(a => a.id === id) ?? null,
  },

  Mutation: {
    createAuthor: (_, { input }) => {
      const { name, bio = null } = input;

      const exists = authors.find(
        a => a.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) throw new Error(`Автор с именем "${name}" уже существует`);

      const newAuthor = {
        id: String(authors.length + 1),
        name,
        bio,
      };

      authors.push(newAuthor);
      return newAuthor;
    },

    createBook: (_, { input }) => {
      const { title, genre, year, authorId } = input;

      const authorExists = authors.find(a => a.id === authorId);
      if (!authorExists) {
        throw new Error(`Автор с id "${authorId}" не найден`);
      }

      const newBook = {
        id: String(books.length + 1),
        title,
        genre,
        year,
        authorId,
      };

      books.push(newBook);
      return newBook;
    },
  },

  Book: {
    author: (parent) => {
      return authors.find(a => a.id === parent.authorId) ?? null;
    },
  },

  Author: {
    books: (parent) => {
      return books.filter(b => b.authorId === parent.id);
    },
  },
};