import { mongoose } from '@typegoose/typegoose';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import path from 'path';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import { COOKIE_NAME, __prod__ } from './constants';
import { Post } from './entities/Post';
import { User } from './entities/User';
import { Vote } from './entities/Vote';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { Context } from './types/Context';
import { buildDataLoaders } from './utils/dataLoaders';
require('dotenv').config();

// Các biến môi trường sẽ được cấu hình trong app/settings "Config Vars"
const main = async () => {
    const connection = await createConnection({
      type: "postgres",
      ...(__prod__
        ? { url: process.env.DATABASE_URL }
        : {
            database: "reddit",
            username: process.env.DB_USERNAME_DEV,
            password: process.env.DB_PASSWORD_DEV,
          }),
      logging: true,
      ...(__prod__ ? {
        extra: {
            ssl: {
                rejectUnauthorized: false
            }
        }, 
        ssl: true
      } : {}),
      ...(__prod__ ? {} : {synchronize: true}) ,
      entities: [User, Post, Vote],
      migrations: [path.join(__dirname, '/migrations/*')]
    });

    if (__prod__) await connection.runMigrations();

    const app = express();

    app.use(cors({
        origin: __prod__ ? process.env.CORS_ORIGIN_PROD : process.env.CORS_ORIGIN_DEV,
        credentials: true, // Receive cookie from client
    }));

    // Session/cookie store
    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_DEV}:${process.env.SESSION_DB_PASSWORD_DEV}@reddit.n5rwj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
    await mongoose.connect(mongoUrl);

    console.log('Mongo connected');

    app.use(session({
        name: COOKIE_NAME,
        store: MongoStore.create({ mongoUrl }),
        cookie: {
            maxAge: 1000 * 60 * 60, // 1 hour
            httpOnly: true, // JS frontend cannot access the cookie
            secure: __prod__, // cookie only works in https
            sameSite: 'lax', // protection agains csrf
            domain: __prod__ ? '.vercel.app' : undefined
        },
        secret: process.env.SESSION_SECRET_DEV as string,
        saveUninitialized: false, // don't save empty session, right from the start
        resave: false,
    }));

    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [HelloResolver, UserResolver, PostResolver],
        validate: false,
      }),
      plugins: [
        ApolloServerPluginLandingPageGraphQLPlayground({
          settings: {
            "request.credentials": "include",
          },
        }),
      ],
      context: ({ req, res }): Context => ({
        req,
        res,
        connection,
        dataLoaders: buildDataLoaders(),
      }),
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({app, cors: false});

    const PORT = process.env.PORT || 9000;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}. GraphQL server started on localhost: ${PORT}${apolloServer.graphqlPath}`));
}

main().catch(err => console.log('error: ', err.message));