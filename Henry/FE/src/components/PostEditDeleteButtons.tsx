import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { Box, IconButton } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { PaginationPosts, useDeletePostMutation, useMeQuery } from "../generated/graphql";

interface PostEditDeleteButtonsProps {
    postId: string
    postUserId: string
}

const PostEditDeleteButton = ({postId, postUserId}: PostEditDeleteButtonsProps) => {
  const {data: meData} = useMeQuery();
    const [deletePost] = useDeletePostMutation();

    const onPostDelete = async (postId: string) => {
        await deletePost({
            variables: {
                id: postId
            }, 
            update(cache, {data}) {
              if (data?.deletePost.success) {
                cache.modify({
                  fields: {
                    posts(
                      // Pick dùng để lấy ra các thuộc tính cần trong Type PaginationPosts
                      existing: Pick<
                        PaginationPosts,
                        "__typename" | "cursor" | "hasMore" | "totalCount"
                      > & {
                        paginatedPosts: { __ref: string }[];
                      }
                    ) {
                      const newPostAfterDeletion = {
                        ...existing,
                        totalCount: existing.totalCount - 1,
                        paginatedPosts: existing.paginatedPosts.filter(
                          (postRef: any) => postRef.__ref !== `Post:${postId}`
                        ),
                      };

                      return newPostAfterDeletion;
                    },
                  },
                });
              }
            }
        });
    }

    if (meData?.me?.id !== postUserId) return null;

    return (
      <Box>
        <NextLink href={`/posts/edit/${postId}`}>
          <IconButton icon={<EditIcon />} aria-label="edit" mr={4} />
        </NextLink>

        <IconButton
          icon={<DeleteIcon />}
          aria-label="delete"
          colorScheme="red"
          onClick={onPostDelete.bind(this, postId)}
        />
      </Box>
    );
}

export default PostEditDeleteButton;
