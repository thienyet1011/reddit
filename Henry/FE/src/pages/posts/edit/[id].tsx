import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/alert";
import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../../../components/InputField";
import Layout from "../../../components/Layout";
import { UpdatePostInput, useMeQuery, usePostQuery, useUpdatePostMutation } from "../../../generated/graphql";

const PostEdit = () => {
    const router = useRouter();
    const postId = router.query.id as string;
    
    const {data: meData, loading: meLoading} = useMeQuery();
    const {data: postData, loading: postLoading} = usePostQuery({
        variables: {
            id: postId
        }
    });

    const [updatePost, _] = useUpdatePostMutation();

    // Omit dùng để bỏ đi thuộc tính 'id' trong Type UpdatePostInput
    const onUpdatePostSubmit = async(values: Omit<UpdatePostInput, 'id'>) => {
        await updatePost({
            variables: {
                updatePostInput: {
                    id: postId,
                    ...values
                }
            }
        });

        router.back();
    }

    if (meLoading || postLoading) {
      return (
        <Flex justifyContent="center" alignItems="center" maxH="100vh">
          <Spinner />
        </Flex>
      );
    }

    if (!postData?.post) {
        return (
          <Layout>
            <Alert status="error">
              <AlertIcon />
              <AlertTitle mr={2}>Post not found</AlertTitle>
            </Alert>

            <NextLink href="/">
              <Box mt={4}>
                <Button>Back to Home page</Button>
              </Box>
            </NextLink>
          </Layout>
        );
    }

    if (
      !meLoading &&
      !postLoading &&
      meData?.me?.id !== postData?.post?.userId.toString()
    ) {
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>UnAuthorized</AlertTitle>
        </Alert>

        <NextLink href="/">
          <Box mt={4}>
            <Button>Back to Home page</Button>
          </Box>
        </NextLink>
      </Layout>;
    }

    const initialValues = {
        title: postData.post.title,
        text: postData.post.text
    };

    return (
        <Layout>
        <Formik initialValues={initialValues} onSubmit={onUpdatePostSubmit}>
          {({ values, isSubmitting }) => {
            console.log('values: ', values);
            
            return (
              <Form>
                <Box>
                  <InputField label="Title" name="title" placeholder="Title" />
                </Box>

                <Box mt={4}>
                  <InputField
                    label="Text"
                    name="text"
                    placeholder="Text"
                    textarea={true}
                  />
                </Box>

                <Flex mt={4} justifyContent="space-between" alignItems="center">
                  <Button
                    type="submit"
                    colorScheme="teal"
                    isLoading={isSubmitting}
                  >
                    Update Post
                  </Button>

                  <NextLink href="/">
                    <Button>Back to Home page</Button>
                  </NextLink>
                </Flex>
              </Form>
            );
          }}
        </Formik>  
        </Layout>
    );
}

export default PostEdit;;
