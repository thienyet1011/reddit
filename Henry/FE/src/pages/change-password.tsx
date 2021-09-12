import { Alert, AlertIcon, AlertTitle, Box, Button, Flex, Link, Spinner } from '@chakra-ui/react';
import { Form, Formik, FormikHelpers } from 'formik';
import router, { useRouter } from 'next/router';
import NextLink from 'next/link';
import React, { useState } from 'react';
import Container from '../components/Container';
import InputField from '../components/InputField';
import { ChangePasswordInput, MeDocument, MeQuery, useChangePasswordMutation } from '../generated/graphql';
import { mapFieldErrors } from '../helpers/mapFieldErrors';
import { useAuth } from '../utils/useAuth';

const ChangePassword = () => {
    const {query} = useRouter();
    const initialValues: ChangePasswordInput = { newPassword: '' };
    const [changePassword] = useChangePasswordMutation();
    const { data: authData, loading: authLoading } = useAuth();
  
    const [tokenError, setTokenError] = useState("");

    const onChangePasswordSubmit = async (
        values: ChangePasswordInput, 
        { setErrors }: FormikHelpers<ChangePasswordInput>) => {
        if (query.userId && query.token) {
            const response = await changePassword({
                variables: {
                    userId: query.userId as string,
                    token: query.token as string,
                    changePasswordInput: values
                }, 
                update(cache, { data }) {
                    if (data?.changePassword.success) {
                      cache.writeQuery<MeQuery>({
                        query: MeDocument,
                        data: {
                          me: data.changePassword.user,
                        },
                      });
                    }
                }
            });

            if (response.data?.changePassword.errors) {
                const fieldErrors = mapFieldErrors(response.data.changePassword.errors);
                if ('token' in fieldErrors) {
                    setTokenError(fieldErrors.token);
                }
                setErrors(fieldErrors);
            } else if (response.data?.changePassword.user) {
                router.push('/');
            }
        }
    }

    return authLoading || (!authLoading && authData?.me) ? (
      <Flex justifyContent="center" alignItems="center" maxH="100vh">
        <Spinner />
      </Flex>
    ) : !query.userId || !query.token ? (
      <Container size="small">
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Invalid password change request!</AlertTitle>
        </Alert>
        <NextLink href="/login">
          <Link>Go back to Login</Link>
        </NextLink>
      </Container>
    ) : (
      <Container>
        <Formik initialValues={initialValues} onSubmit={onChangePasswordSubmit}>
          {({ isSubmitting }) => (
            <Form>
              <Box mt={4}>
                <InputField
                  label="New password"
                  name="newPassword"
                  placeholder="New password"
                  type="password"
                />
                {tokenError && (
                  <Flex>
                    <Box color="red" mr={2}>
                      {tokenError}
                    </Box>
                    <NextLink href="/forgot-password">
                      <Link>Go back to Forgot Password</Link>
                    </NextLink>
                  </Flex>
                )}
              </Box>

              <Button
                type="submit"
                colorScheme="teal"
                mt={4}
                isLoading={isSubmitting}
              >
                Change Password
              </Button>
            </Form>
          )}
        </Formik>
      </Container>
    );
}

export default ChangePassword;
