import { PostResolver } from './resolvers/post';
require('dotenv').config();
import 'reflect-metadata';

import express from 'express';
import mongoose from 'mongoose';

import { createConnection } from 'typeorm';
import { buildSchema } from 'type-graphql';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import MongoStore from 'connect-mongo';
import session from 'express-session';
import cors from 'cors';

import { User } from './entities/User';
import { Post } from './entities/Post';
import { HelloResolver } from './resolvers/hello';
import { UserResolver } from './resolvers/user';
import { COOKIE_NAME, __prod__ } from './constants';
import { Context } from './types/Context';

const main = async () => {
    await createConnection({
        type: 'postgres',
        database: 'reddit',
        username: process.env.DB_USERNAME_DEV,
        password: process.env.DB_PASSWORD_DEV,
        logging: true,
        synchronize: true,
        entities: [User, Post],
    });

    const app = express();

    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true, // Receive cookie from client
    }));

    // Session/cookie store
    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_DEV}:${process.env.SESSION_DB_PASSWORD_DEV}@reddit.n5rwj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
    await mongoose.connect(mongoUrl, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    });

    console.log('Mongo connected');

	// app.set('trust proxy', 1);
    app.use(session({
        name: COOKIE_NAME,
        store: MongoStore.create({ mongoUrl }),
        cookie: {
            maxAge: 1000 * 60 * 60, // 1 hour
            httpOnly: true, // JS frontend cannot access the cookie
            secure: __prod__, // cookie only works in https
            sameSite: 'lax', // protection agains csrf
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
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground({
            settings: {
                "request.credentials": "include"
            }
        })],
        context: ({req, res}): Context => ({req, res}),
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({app, cors: false});

    const PORT = process.env.PORT || 9000;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}. GraphQL server started on localhost: ${PORT}${apolloServer.graphqlPath}`));
}

main().catch(err => console.log('error: ', err.message));