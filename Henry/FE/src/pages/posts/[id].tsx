import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
} from "@chakra-ui/react";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import React from "react";
import NextLink from "next/link";
import { limit } from "..";
import Layout from "../../components/Layout";
import { PostDocument, PostIdsDocument, PostIdsQuery, PostQuery, usePostQuery } from "../../generated/graphql";
import { addApolloState, initializeApollo } from "../../lib/apolloClient";

const Post = () => {
  const router = useRouter();
  const { data, loading, error } = usePostQuery({
    variables: {
      id: router.query.id as string,
    },
  });

  if (error || !data?.post) {
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>
            {error ? error.message : "Post not found!"}
          </AlertTitle>
        </Alert>

        <NextLink href="/">
            <Box mt={4}>
                <Button>Back to Home page</Button>
            </Box>
        </NextLink>
      </Layout>
    );
  }

  return (
    <Layout>
      {loading ? (
        <Flex justifyContent="center" alignItems="center" maxH="100vh">
          <Spinner />
        </Flex>
      ) : (
        <React.Fragment>
          <Heading mb={4}>{data.post.title}</Heading>
          <Box mb={4}>{data.post.text}</Box>

          <NextLink href="/">
            <Box mt={4}>
              <Button>Back to Home page</Button>
            </Box>
          </NextLink>
        </React.Fragment>
      )}
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const apolloClient = initializeApollo();

    const {data} = await apolloClient.query<PostIdsQuery>({
        query: PostIdsDocument,
        variables: {
            limit
        }
    });

    return {
        paths: data.posts!.paginatedPosts.map(post => (
            {params: {id: `${post.id}`}}
        )),
        fallback: 'blocking' // Chỉ hiển thị trang này khi render xong
    }
}

export const getStaticProps: GetStaticProps<{ [key: string]: any }, {id: string}> = async ({params}) => {
    const apolloClient = initializeApollo();

    await apolloClient.query<PostQuery>({
        query: PostDocument,
        variables: {
            id: params?.id
        }
    }); // data will saved to Apollo cache

    return addApolloState(apolloClient, {
        props: {},
    });
}

export default Post;
