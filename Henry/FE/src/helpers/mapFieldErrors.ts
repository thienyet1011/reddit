import { FieldError } from './../generated/graphql';

export const mapFieldErrors = (errors: FieldError[]): {[key: string]: string} => {
    // Convert FieldErrors[] array to a object {[error.field]: [error.message]}
    return errors.reduce((accumulatedErrors, error) => {
        return {
            ...accumulatedErrors,
            [error.field]: error.message
        };
    }, {});
}