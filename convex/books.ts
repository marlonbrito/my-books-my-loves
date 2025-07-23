import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

export const listBooks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUser(ctx);
    const books = await ctx.db
      .query("books")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      books.map(async (book) => ({
        ...book,
        coverUrl: book.coverImageId
          ? await ctx.storage.getUrl(book.coverImageId)
          : null,
        backCoverUrl: book.backCoverImageId
          ? await ctx.storage.getUrl(book.backCoverImageId)
          : null,
      }))
    );
  },
});

export const getBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const book = await ctx.db.get(args.bookId);
    
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or access denied");
    }

    return {
      ...book,
      coverUrl: book.coverImageId
        ? await ctx.storage.getUrl(book.coverImageId)
        : null,
      backCoverUrl: book.backCoverImageId
        ? await ctx.storage.getUrl(book.backCoverImageId)
        : null,
    };
  },
});

export const getLoanedBooks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUser(ctx);
    const loanedBooks = await ctx.db
      .query("books")
      .withIndex("by_user_and_loaned", (q) => q.eq("userId", userId).eq("isLoaned", true))
      .collect();

    return Promise.all(
      loanedBooks.map(async (book) => ({
        ...book,
        coverUrl: book.coverImageId
          ? await ctx.storage.getUrl(book.coverImageId)
          : null,
      }))
    );
  },
});

export const searchBooks = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    if (!args.searchTerm.trim()) {
      return [];
    }

    const books = await ctx.db
      .query("books")
      .withSearchIndex("search_books", (q) =>
        q.search("title", args.searchTerm).eq("userId", userId)
      )
      .take(20);

    return Promise.all(
      books.map(async (book) => ({
        ...book,
        coverUrl: book.coverImageId
          ? await ctx.storage.getUrl(book.coverImageId)
          : null,
      }))
    );
  },
});

export const createBook = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    genre: v.string(),
    rating: v.number(),
    isRead: v.boolean(),
    isPartOfSeries: v.boolean(),
    seriesName: v.optional(v.string()),
    isLoaned: v.boolean(),
    loanedTo: v.optional(v.string()),
    summary: v.optional(v.string()),
    isbn: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    backCoverImageId: v.optional(v.id("_storage")),
    publishedYear: v.optional(v.number()),
    publisher: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    
    return await ctx.db.insert("books", {
      userId,
      ...args,
      loanDate: args.isLoaned ? Date.now() : undefined,
    });
  },
});

export const updateBook = mutation({
  args: {
    bookId: v.id("books"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    genre: v.optional(v.string()),
    rating: v.optional(v.number()),
    isRead: v.optional(v.boolean()),
    isPartOfSeries: v.optional(v.boolean()),
    seriesName: v.optional(v.string()),
    isLoaned: v.optional(v.boolean()),
    loanedTo: v.optional(v.string()),
    summary: v.optional(v.string()),
    isbn: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    backCoverImageId: v.optional(v.id("_storage")),
    publishedYear: v.optional(v.number()),
    publisher: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const { bookId, ...updates } = args;
    
    const book = await ctx.db.get(bookId);
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or access denied");
    }

    // Update loan date if loan status changed
    const finalUpdates: any = { ...updates };
    if (updates.isLoaned !== undefined) {
      if (updates.isLoaned && !book.isLoaned) {
        finalUpdates.loanDate = Date.now();
      } else if (!updates.isLoaned && book.isLoaned) {
        finalUpdates.loanDate = undefined;
        finalUpdates.loanedTo = undefined;
      }
    }

    return await ctx.db.patch(bookId, finalUpdates);
  },
});

export const deleteBook = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const book = await ctx.db.get(args.bookId);
    
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or access denied");
    }

    await ctx.db.delete(args.bookId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const toggleReadStatus = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const book = await ctx.db.get(args.bookId);
    
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or access denied");
    }

    await ctx.db.patch(args.bookId, { isRead: !book.isRead });
  },
});

export const toggleLoanStatus = mutation({
  args: { 
    bookId: v.id("books"),
    loanedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUser(ctx);
    const book = await ctx.db.get(args.bookId);
    
    if (!book || book.userId !== userId) {
      throw new Error("Book not found or access denied");
    }

    const isLoaned = !book.isLoaned;
    await ctx.db.patch(args.bookId, {
      isLoaned,
      loanedTo: isLoaned ? args.loanedTo : undefined,
      loanDate: isLoaned ? Date.now() : undefined,
    });
  },
});
