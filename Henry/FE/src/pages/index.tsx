import { NetworkStatus } from "@apollo/client";
import { Box, Button, Flex, Heading, Spinner, Stack, Text } from "@chakra-ui/react";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import NextLink from 'next/link';
import React from "react";
import Layout from "../components/Layout";
import PostEditDeleteButton from "../components/PostEditDeleteButtons";
import VoteSection from "../components/VoteSection";
import { PostsDocument, usePostsQuery } from "../generated/graphql";
import { addApolloState, initializeApollo } from "../lib/apolloClient";

export const limit = 3;

const Index = () => {
  const { data, loading, fetchMore, networkStatus } = usePostsQuery({
    variables: {
      limit
    },
    // Component render from usePostQuery will re-render when network status changed
    // it means fetchMore
    notifyOnNetworkStatusChange: true
  }); // Will get call to Apollo Cache if available

  const loadingMorePosts = networkStatus === NetworkStatus.fetchMore;

  // data will updated in InMemory Cache 
  // in lib/apolloClient.ts - createApolloClient() function
  // in cache's typePolicies field
  const loadMorePosts = () => {
    console.log('data: ', data?.posts?.cursor);

    return fetchMore({
      variables: {
        cursor: data?.posts?.cursor
      },
    });
  };

  return (
    <Layout>
      {loading && !loadingMorePosts ? (
        <Flex justifyContent="center" alignItems="center" minH="100vh">
          <Spinner />
        </Flex>
      ) : (
        <Stack spacing={8}>
          {data?.posts?.paginatedPosts?.map((post) => (
            <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
              <VoteSection post={post} />
              <Box flex={1}>
                <NextLink href={`/posts/${post.id}`}>
                  <Heading fontSize="xl">{post.title}</Heading>
                </NextLink>

                <Text>post by {post.user.username}</Text>
                <Flex align="center">
                  <Text mt={4}>{post.textSnippet}</Text>
                  <Box ml="auto">
                      <PostEditDeleteButton postId={post.id} postUserId={post.user.id} />
                  </Box>
                </Flex>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}

      {data?.posts?.hasMore && (
        <Flex mt={10}>
          <Button
            m="auto"
            mb={8}
            isLoading={loadingMorePosts}
            onClick={loadMorePosts}
          >
            {loadingMorePosts ? "Loading" : "Load more"}
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const apolloClient = initializeApollo({headers: context.req.headers});

  await apolloClient.query({
    query: PostsDocument,
    variables: {
      limit
    }
  }); // Next JS call query to get posts from Apollo server and then save to Apollo Cache

  return addApolloState(apolloClient, {
    props: {},
  });
}

export default Index;
