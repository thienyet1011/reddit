import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { PostWithUserFragment, useMeQuery, useVoteMutation, VoteType } from "../generated/graphql";

interface VoteSectionProps {
    post: PostWithUserFragment
}

enum VoteTypeValues {
    Upvote = 1,
    Downvote = -1
}

const VoteSection = ({post}: VoteSectionProps) => {
  const router = useRouter();
  const {data: meData} = useMeQuery();
  const [loadingState, setLoadingState] = useState<
    "upvote-loading" | "downvote-loading" | "not-loading"
  >("not-loading");

  const [vote, { loading }] = useVoteMutation();

  const upvote = async (postId: string) => {
    try {
      setLoadingState("upvote-loading");
      await vote({
        variables: {
          inputVoteValue: VoteType.Upvote,
          postId: parseInt(postId),
        },
      });
      setLoadingState("not-loading");
    } catch {
      router.push("/login");
    }
  };

  const downvote = async (postId: string) => {
    try {
      setLoadingState("downvote-loading");
      await vote({
        variables: {
          inputVoteValue: VoteType.Downvote,
          postId: parseInt(postId),
        },
      });
      setLoadingState("not-loading");
    } catch {
      router.push("/login");
    }
  };

  return (
    <Flex flexDirection="column" alignItems="center" mr={4}>
      <IconButton
        icon={<ChevronUpIcon />}
        aria-label="upvote"
        isLoading={loading && loadingState === "upvote-loading"}
        onClick={
          post.voteType === VoteTypeValues.Upvote
            ? undefined
            : upvote.bind(this, post.id)
        }
        colorScheme={
          post.voteType === VoteTypeValues.Upvote ? "green" : undefined
        }
        disabled={!meData?.me}
      />
      {post.points}
      <IconButton
        icon={<ChevronDownIcon />}
        aria-label="downvote"
        isLoading={loading && loadingState === "downvote-loading"}
        onClick={
          post.voteType === VoteTypeValues.Downvote
            ? undefined
            : downvote.bind(this, post.id)
        }
        colorScheme={
          post.voteType === VoteTypeValues.Downvote ? "red" : undefined
        }
        disabled={!meData?.me}
      />
    </Flex>
  );
};

export default VoteSection;
