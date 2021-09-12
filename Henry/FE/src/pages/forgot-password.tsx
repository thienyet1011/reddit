import { Box, Button, Flex, Link, Spinner } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import React from 'react';
import NextLink from 'next/link';
import Container from '../components/Container';
import InputField from '../components/InputField';
import { ForgotPasswordInput, useForgotPasswordMutation } from '../generated/graphql';
import { useAuth } from '../utils/useAuth';

const ForgotPassword = () => {
    const initialValues = {email: ''};
    const [forgotPassword, {loading, data}] = useForgotPasswordMutation();
    const { data: authData, loading: authLoading } = useAuth();

    const onForgotPasswordSubmit = async (values: ForgotPasswordInput) => {
        await forgotPassword({
            variables:{forgotPasswordInput: values}
        });
    }

    return authLoading || (!authLoading && authData?.me) ? (
      <Flex justifyContent="center" alignItems="center" maxH="100vh">
        <Spinner />
      </Flex>
    ) : (
      <Container size="small">
        <Formik initialValues={initialValues} onSubmit={onForgotPasswordSubmit}>
          {({ isSubmitting }) => !loading && data 
            ? (
                <Box>Please check your inbox</Box>
            )
            : (
            <Form>
              <InputField
                label="Email"
                name="email"
                placeholder="Email"
                type="email"
              />

              <Flex mt={2}>
                <NextLink href="/login" passHref>
                    <Link ml="auto">Back to Login</Link>
                </NextLink>
              </Flex>

              <Button
                type="submit"
                colorScheme="teal"
                mt={4}
                isLoading={isSubmitting}
              >
                Send Reset Password Email
              </Button>
            </Form>
          )}
        </Formik>
      </Container>
    );
}

export default ForgotPassword;
