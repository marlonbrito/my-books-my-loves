import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  books: defineTable({
    userId: v.id("users"),
    title: v.string(),
    author: v.string(),
    genre: v.string(),
    rating: v.number(), // 1-5 stars
    isRead: v.boolean(),
    isPartOfSeries: v.boolean(),
    seriesName: v.optional(v.string()),
    isLoaned: v.boolean(),
    loanedTo: v.optional(v.string()),
    loanDate: v.optional(v.number()),
    summary: v.optional(v.string()),
    isbn: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    backCoverImageId: v.optional(v.id("_storage")),
    publishedYear: v.optional(v.number()),
    publisher: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    language: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_user_and_loaned", ["userId", "isLoaned"])
    .searchIndex("search_books", {
      searchField: "title",
      filterFields: ["userId", "author", "genre"],
    }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
