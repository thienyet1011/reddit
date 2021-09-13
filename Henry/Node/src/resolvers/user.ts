import { validateRegisterInput } from "./../utils/validateRegisterInput";
import { UserMutationResponse } from "../types/UserMutationResponse";
import { User } from "../entities/User";
import { Arg, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from "type-graphql";
import argon2 from "argon2";
import { RegisterInput } from "../types/RegisterInput";
import { LoginInput } from "../types/LoginInput";
import { Context } from "../types/Context";
import { COOKIE_NAME } from "../constants";
import { ForgotPasswordInput } from "../types/ForgotPasswordInput";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../utils/sendEmail";
import { TokenModel } from "../models/Token";
import { ChangePasswordInput } from "../types/ChangePasswordInput";

@Resolver(_of => User) // _of => User là Type trả về cho FieldResolver
export class UserResolver {
  @FieldResolver(_return => String)
  async email(
    @Root() user: User, 
    @Ctx() { req }: Context
  ) {
    return req.session.userId === user.id ? user.email : "";
  }

  @Query(_return => User, { nullable: true })
  async me(@Ctx() { req }: Context): Promise<User | undefined | null> {
    if (!req.session.userId) return null;

    const user = User.findOne(req.session.userId);
    return user;
  }

  @Mutation((_return) => UserMutationResponse)
  async register(
    @Arg("registerInput") registerInput: RegisterInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    const validateRegisterInputErrors = validateRegisterInput(registerInput);
    if (validateRegisterInputErrors !== null) {
      return {
        code: 400,
        success: false,
        ...validateRegisterInputErrors,
      };
    }

    try {
      const { username, email, password } = registerInput;
      const exists = await User.findOne({
        where: [{ username }, { email }],
      });

      if (exists) {
        return {
          code: 400,
          success: false,
          message: "Duplicated username or email!",
          errors: [
            {
              field: exists.username === username ? "username" : "email",
              message: `${
                exists.username === username ? "Username" : "Email"
              } already taken!`,
            },
          ],
        };
      }

      const hashPassword = await argon2.hash(password);

      let user = User.create({
        username,
        password: hashPassword,
        email,
      });

      user = await User.save(user);
      req.session.userId = user.id;

      return {
        code: 200,
        success: true,
        message: "User registration successful!",
        user: user,
      };
    } catch (err) {
      console.log("====================================");
      console.log("error: ", err.message);
      console.log("====================================");

      return {
        code: 500,
        success: false,
        message: `Internal server error ${err.message}`,
      };
    }
  }

  @Mutation((_return) => UserMutationResponse)
  async login(
    @Arg("loginInput") {usernameOrEmail, password}: LoginInput,
    @Ctx() {req}: Context
  ): Promise<UserMutationResponse> {
      try {
        console.log('userId1: ', req.session);
        const user = await User.findOne(
          usernameOrEmail.includes("@")
            ? { email: usernameOrEmail }
            : { username: usernameOrEmail }
        );

        if (!user) {
            return {
                code: 400,
                success: false,
                message: 'User not found!',
                errors: [
                    {
                        field: 'usernameOrEmail',
                        message: 'Username or email incorrect!'
                    }
                ]
            }
        }

        const passwordValid = await argon2.verify(user.password, password);
        if (!passwordValid) {
            return {
                code: 400,
                success: false,
                message: 'Wrong password!',
                errors: [
                    {
                        field: 'password',
                        message: 'Wrong password!'
                    }
                ]
            }
        }

        // Create session & return cookie
        req.session.userId = user.id;
        console.log('userId: ', req.session);

        return {
            code: 200,
            success: true,
            message: 'Login in successfully',
            user
        }
      } catch (err) {
        console.log("====================================");
        console.log("error: ", err.message);
        console.log("====================================");

        return {
            code: 500,
            success: false,
            message: `Internal server error ${err.message}`,
        };
      }
  }

  @Mutation((_return) => Boolean)
  logout(
      @Ctx() { req, res }: Context
  ): Promise<Boolean> {
      return new Promise((resolve, _reject) => {
        res.clearCookie(COOKIE_NAME);
        req.session.destroy((err) => {
            if (err) {
                console.log('Destroy session error: ', err.message);
                resolve(false);
            }

            resolve(true);
        });
      });
  }

  @Mutation(_return => Boolean)
  async forgotPassword(
    @Arg('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput
  ): Promise<Boolean> {
    const user = await User.findOne({email: forgotPasswordInput.email});
    if (!user) return true;

    // Delete old reset token if available
    await TokenModel.findOneAndDelete({userId: `${user.id}`});
    
    const token = uuidv4();
    const hash = await argon2.hash(token);

    // Save token to db
    await new TokenModel({userId: `${user.id}`, token: hash}).save();

    // Send reset password link to user via email
    await sendEmail(
      forgotPasswordInput.email,
      `<a href="http://localhost:3000/change-password?token=${token}&userId=${user.id}">Click here to reset your password</a>`
    );

    return true;
  }

  @Mutation(_return => UserMutationResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("userId") userId: string,
    @Arg("changePasswordInput") changePasswordInput: ChangePasswordInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    if (changePasswordInput.newPassword.length < 3) 
      return {
        code: 400,
        success: false,
        message: 'Invalid password',
        errors: [{
          field: 'email',
          message: 'Length must be greater than 2'
        }]
      }

    try {
      const resetPasswordToken = await TokenModel.findOne({userId});
      if (!resetPasswordToken) {
        return {
          code: 400,
          success: false,
          message: 'Invalid or expired password reset token',
          errors: [{
            field: 'token',
            message: 'Invalid or expired password reset token'
          }]
        }
      }

      const resetPasswordTokenValid = argon2.verify(resetPasswordToken.token, token);
      if (!resetPasswordTokenValid) {
        return {
          code: 400,
          success: false,
          message: 'Invalid or expired password reset token',
          errors: [{
            field: 'token',
            message: 'Invalid or expired password reset token'
          }]
        }
      }

      const hash = await argon2.hash(changePasswordInput.newPassword);
      const user = await User.findOne({id: parseInt(userId)});

      if (!user) {
        return {
          code: 400,
          success: false,
          message: 'User no longer exists',
          errors: [{
            field: 'token',
            message: 'User no longer exists'
          }]
        }
      }

      user.password = hash;
      await user.save(); // Update new password in postgres 

      await resetPasswordToken.deleteOne(); // Delete reset token in mongo
      req.session.userId = user.id;

      return {
        code: 200, 
        success: true, 
        message: 'User password reset successful',
        user
      }
    } catch (err) {
      console.log("====================================");
      console.log("error: ", err.message);
      console.log("====================================");

      return {
          code: 500,
          success: false,
          message: `Internal server error ${err.message}`,
      };
    }
  }
}
