import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import NextLink from "next/link";
import router from "next/router";
import React from "react";
import InputField from "../components/InputField";
import Layout from "../components/Layout";
import { CreatePostInput, useCreatePostMutation } from "../generated/graphql";
import { useAuth } from "../utils/useAuth";

const CreatePost = () => {
  const { data: authData, loading: authLoading } = useAuth();
  const initialValues: CreatePostInput = { title: "", text: "" };

  const [createPost] = useCreatePostMutation();

  const onCreatePostSubmit = async (values: CreatePostInput) => {
      await createPost({
        variables: {
            createPostInput: values
        },
        update(cache, {data}) {
            cache.modify({
                fields: {
                    posts(existing) {
                        console.log('existing: ', existing);
                        
                        if (data?.createPost.success && data.createPost.post) {
                            // Post:new_id (return from cache.identify)
                            const newPostRef = cache.identify(data.createPost.post);
                            console.log('newPostRef: ', newPostRef);
                            
                            const newPostAfterCreation = {
                                ...existing,
                                totalCount: existing.totalCount + 1,
                                paginatedPosts: [
                                    {__ref: newPostRef},
                                    ...existing.paginatedPosts // [{__ref: 'Post:1'}, {__ref: 'Post:2'}]
                                ] 
                            }

                            console.log('newPostAfterCreation: ', newPostAfterCreation);
                            
                            return newPostAfterCreation;
                        }
                    }
                }
            })
        }
      });

      router.push("/");
  };

  return authLoading || (!authLoading && !authData?.me) ? (
    <Flex justifyContent="center" alignItems="center" maxH="100vh">
      <Spinner />
    </Flex>
  ) : (
    <Layout>
      <Formik initialValues={initialValues} onSubmit={onCreatePostSubmit}>
        {({ isSubmitting }) => (
          <Form>
            <Box mt={4}>
              <InputField label="Title" name="title" placeholder="Title" />

              <InputField
                label="Text"
                name="text"
                placeholder="Text"
                textarea={true}
              />
            </Box>

            <Flex justifyContent="center" alignItems="center" mt={4}>
              <Button
                type="submit"
                colorScheme="teal"
                isLoading={isSubmitting}
              >
                Create Post
              </Button>

              <NextLink href="/">
                <Button type="button">Go back to Home</Button>
              </NextLink>
            </Flex>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default CreatePost;
