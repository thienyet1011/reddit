import { Box, Button, Flex, Link, Spinner, useToast } from "@chakra-ui/react";
import { Form, Formik, FormikHelpers } from "formik";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import Container from "../components/Container";
import InputField from "../components/InputField";
import {
  LoginInput,
  MeDocument,
  MeQuery,
  useLoginMutation,
} from "../generated/graphql";
import { mapFieldErrors } from "../helpers/mapFieldErrors";
import { useAuth } from "../utils/useAuth";

const Login = () => {
  const router = useRouter();
  const { data: authData, loading: authLoading } = useAuth();

  const initialValues: LoginInput = {
    usernameOrEmail: "",
    password: "",
  };

  // useLoginMutation (../generated/graphql.tsx) using graphql code generator to create
  // when run graphql codegen must be start graphql-server
  // https://www.graphql-code-generator.com/docs/getting-started/installation
  const [loginUser, { loading: _loginUserLoading, data }] = useLoginMutation();

  const onLoginSubmit = async (
    values: LoginInput,
    { setErrors }: FormikHelpers<LoginInput>
  ) => {
    const response = await loginUser({
      variables: {
        loginInput: values,
      },
      update(cache, { data }) {
        // Read apollo cached from Me Query result
        // const meData = cache.readQuery({query: MeDocument)
        // console.log('meData: ', meData);

        if (data?.login.success) {
          cache.writeQuery<MeQuery>({
            query: MeDocument,
            data: {
              me: data.login.user,
            },
          });
        }
      },
    });

    if (response.data?.login.errors) {
      setErrors(mapFieldErrors(response.data.login.errors));
    } else if (response.data?.login.user) {
      router.push("/");
    }
  };

  const toast = useToast();

  return authLoading || (!authLoading && authData?.me) ? (
    <Flex justifyContent="center" alignItems="center" maxH="100vh">
      <Spinner />
    </Flex>
  ) : (
    <Container size="small">
      {data && data.login.success && 
        toast({
          title: "Welcome",
          description: "Login in successfully.",
          status: "success",
          duration: 9000,
          isClosable: true,
        })
      }
      <Formik initialValues={initialValues} onSubmit={onLoginSubmit}>
        {({ isSubmitting }) => (
          <Form>
            <Box>
              <InputField
                label="Username or Email"
                name="usernameOrEmail"
                placeholder="Username or Email"
              />
            </Box>

            <Box mt={4}>
              <InputField
                label="Password"
                name="password"
                placeholder="Password"
                type="password"
              />
            </Box>

            <Flex mt={2}>
              <NextLink href="/forgot-password" passHref>
                  <Link ml="auto">Forgot password</Link>
              </NextLink>
            </Flex>

            <Button
              type="submit"
              colorScheme="teal"
              mt={4}
              isLoading={isSubmitting}
            >
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default Login;
