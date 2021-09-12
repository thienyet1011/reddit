import { FormControl, FormErrorMessage, FormLabel, Input } from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react';

interface IInputFieldProps {
    name: string
    label: string
    placeholder: string
    type?: string
}

const InputField = (props: IInputFieldProps) => {
    const [field, {error}] = useField(props);

    return (
      <FormControl isInvalid={!!error}>
        <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
        <Input
          id={field.name}
          placeholder={props.placeholder}
          type={props.type ?? "text"}
          {...field}
        />
        {error && <FormErrorMessage>{error}</FormErrorMessage>}
      </FormControl>
    );
};

export default InputField;
