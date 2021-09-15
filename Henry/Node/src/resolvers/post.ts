import { UserInputError } from "apollo-server-errors";
import { Arg, Ctx, FieldResolver, ID, Int, Mutation, Query, registerEnumType, Resolver, Root, UseMiddleware } from "type-graphql";
import { LessThan } from "typeorm";
import { Post } from "../entities/Post";
import { User } from "../entities/User";
import { Vote } from '../entities/Vote';
import { authenticate } from "../middleware/auth";
import { Context } from "../types/Context";
import { CreatePostInput } from "../types/CreatePostInput";
import { PaginationPosts } from "../types/PaginationPosts";
import { PostMutationResponse } from "../types/PostMutationResponse";
import { UpdatePostInput } from "../types/UpdatePostInput";
import { VoteType } from "../types/VoteType";

registerEnumType(VoteType, {
  name: "VoteType", // this one is mandatory
});

@Resolver(_of => Post)
export class PostResolver {
  @FieldResolver(_return => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(_return => User)
  async user(@Root() root: Post) {
    return await User.findOne(root.userId);
  }

  @FieldResolver(_return => Int)
  async voteType(@Root() root: Post, @Ctx() {req}: Context) {
    if (!req.session.userId) return 0;
    const vote = await Vote.findOne({postId: root.id, userId: req.session.userId});
    return vote ? vote.value : 0;
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(authenticate)
  async createPost(
    @Arg("createPostInput") { title, text }: CreatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const post = Post.create({
        title,
        userId: req.session.userId,
        text,
      });

      return {
        code: 200,
        success: true,
        message: "Post created successfully",
        post: await post.save(),
      };
    } catch (err) {
      console.log("====================================");
      console.log("error: ", err.message);
      console.log("====================================");

      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }

  @Query((_return) => PaginationPosts, { nullable: true })
  async posts(
    @Arg('limit', _type => Int) limit: number,
    @Arg('cursor', {nullable: true}) cursor?: string
  ): Promise<PaginationPosts | undefined> {
    try {
      const totalPostCount = await Post.count();
      const realLimit = Math.min(10, limit);

      const findOptions: {[key: string]: any} = {
        order: {
          createdAt: 'DESC'
        },
        take: realLimit
      };

      let lastPost: Post[] = [];
      if (cursor) {
        findOptions.where = {
          createdAt: LessThan(cursor),
        };

        lastPost = await Post.find({order: {createdAt: 'ASC'}, take: 1});
      }

      const posts = await Post.find(findOptions);

      return {
        totalCount: totalPostCount,
        cursor: posts[posts.length - 1].createdAt,
        hasMore: cursor
          ? posts[posts.length - 1].createdAt.toString() !== lastPost[0].createdAt.toString()
          : posts.length !== totalPostCount,
        paginatedPosts: posts,
      };
    } catch (err) {
      console.log("====================================");
      console.log("error: ", err.message);
      console.log("====================================");

      return undefined;
    }
  }

  @Query((_return) => Post, { nullable: true })
  async post(@Arg("id", (_type) => ID) id: number): Promise<Post | undefined> {
    try {
      return await Post.findOne(id);
    } catch (err) {
      console.log("====================================");
      console.log("error: ", err.message);
      console.log("====================================");

      return undefined;
    }
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(authenticate)
  async updatePost(
    @Arg("updatePostInput") { id, title, text }: UpdatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      let post = await Post.findOne(id);
      if (!post) {
        return {
          code: 400,
          success: false,
          message: "Post not found",
        };
      }

      if (post.userId !== req.session.userId) {
        return {
          code: 401,
          success: false,
          message: "Unauthorized"
        }
      }

      post.title = title;
      post.text = text;

      return {
        code: 200,
        success: true,
        message: "Post updated successfully",
        post: await post.save(),
      };
    } catch (err) {
      console.log("====================================");
      console.log("error: ", err.message);
      console.log("====================================");

      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(authenticate)
  async deletePost(
    @Arg("id", (_type) => ID) id: number,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      let post = await Post.findOne(id);
      if (!post) {
        return {
          code: 400,
          success: false,
          message: "Post not found",
        };
      }

      if (post.userId !== req.session.userId) {
        return {
          code: 401,
          success: false,
          message: "Unauthorized"
        }
      }

      const result = await Post.delete(id);

      return {
        code: 200,
        success: (result.affected ?? 0) > 0 ? true : false,
        message:
          (result.affected ?? 0) > 0
            ? "Post deleted successfully"
            : "Something wrong. Please try again",
      };
    } catch (err) {
      console.log("====================================");
      console.log("error: ", err.message);
      console.log("====================================");

      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }

  @Mutation(_return => PostMutationResponse)
  @UseMiddleware(authenticate)
  async vote(
    @Arg('postId', _type => Int) postId: number,
    @Arg('inputVoteValue', _type => VoteType) inputVoteValue: VoteType,
    @Ctx() { req, connection }: Context
  ): Promise<PostMutationResponse> {
    try {
      return await connection.transaction(async transactionEntityManager => {
        let post = await transactionEntityManager.findOne(Post, postId);
        if (!post) {
          throw new UserInputError('Post not found');
        }

        // Check if user has voted or not
        const existingVote = await transactionEntityManager.findOne(Vote, {
          userId: req.session.userId,
          postId,
        });

        if (existingVote && existingVote.value !== inputVoteValue) {
          await transactionEntityManager.save(Vote, {
            ...existingVote,
            value: inputVoteValue
          });

          post = await transactionEntityManager.save(Post, {
            ...post,
            points: post.points + 2 * inputVoteValue
          });
        }

        if (!existingVote) {
          const vote = transactionEntityManager.create(Vote, {
            userId: req.session.userId,
            postId: postId,
            value: inputVoteValue
          });
  
          await transactionEntityManager.save(vote);
  
          post.points += inputVoteValue;
          post = await transactionEntityManager.save(post);
        }

        return {
          code: 200,
          success: true,
          message: "Post voted",
          post
        };
      });
    } catch(err) {
      console.log("====================================");
      console.log("error: ", err.message);
      console.log("====================================");

      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }
}
