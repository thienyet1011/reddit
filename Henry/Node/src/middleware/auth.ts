import { AuthenticationError } from "apollo-server-errors";
import { MiddlewareFn } from "type-graphql";
import { Context } from "../types/Context";

export const authenticate: MiddlewareFn<Context> = (
  { context: { req } },
  next
) => {
  if (!req.session.userId) {
    throw new AuthenticationError(
      "Not authentication to perform GraphQL operation"
    );
  }

  return next();
};
