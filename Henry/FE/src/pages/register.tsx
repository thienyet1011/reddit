import { Box, Button, Flex, Spinner, useToast } from "@chakra-ui/react";
import { Form, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/router";
import React from "react";
import Container from "../components/Container";
import InputField from "../components/InputField";

import { MeDocument, MeQuery, RegisterInput, useRegisterMutation } from "../generated/graphql";
import { mapFieldErrors } from "../helpers/mapFieldErrors";
import { useAuth } from "../utils/useAuth";

const Register = () => {
    const router = useRouter();
    const { data: authData, loading: authLoading } = useAuth();

    const initialValues = {
      username: "",
      email: "",
      password: "",
    };

    // useRegisterMutation (../generated/graphql.tsx) using graphql code generator to create
    // when run graphql codegen must be start graphql-server
    // https://www.graphql-code-generator.com/docs/getting-started/installation
    const [registerUser, { loading: _registerUserLoading, data }] = useRegisterMutation();

    const onRegisterSubmit = async (values: RegisterInput, { setErrors }: FormikHelpers<RegisterInput>) => {
        const response = await registerUser({
            variables: {
                registerInput: values
            }, 
            update(cache, { data }) {
              if (data?.register.success) {
                cache.writeQuery<MeQuery>({
                  query: MeDocument,
                  data: { me: data.register.user }
                });
              }
            }
        });

        if (response.data?.register.errors) {
            setErrors(mapFieldErrors(response.data.register.errors));
        } else if (response.data?.register.user) {
            router.push("/");
        }
    }

    const toast = useToast();

    return authLoading || (!authLoading && authData?.me) ? (
      <Flex justifyContent="center" alignItems="center" maxH="100vh">
        <Spinner />
      </Flex>
    ) : (
      <Container size="small">
        {data && data.register && 
          toast({
            title: "Account created.",
            description: "We've created your account for you.",
            status: "success",
            duration: 9000,
            isClosable: true,
          })
        }
        <Formik initialValues={initialValues} onSubmit={onRegisterSubmit}>
          {({ isSubmitting }) => (
            <Form>
              <Box>
                <InputField
                  label="Username"
                  name="username"
                  placeholder="Username"
                />
              </Box>

              <Box mt={4}>
                <InputField label="Email" name="email" placeholder="Email" />
              </Box>

              <Box mt={4}>
                <InputField
                  label="Password"
                  name="password"
                  placeholder="Password"
                  type="password"
                />
              </Box>

              <Button
                type="submit"
                colorScheme="teal"
                mt={4}
                isLoading={isSubmitting}
              >
                Register
              </Button>
            </Form>
          )}
        </Formik>
      </Container>
    );
}

export default Register;
