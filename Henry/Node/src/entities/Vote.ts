import { Field, ObjectType } from 'type-graphql';
import { Post } from './Post';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from './User';

@ObjectType()
@Entity()
export class Vote extends BaseEntity {
    @Field()
    @PrimaryColumn()
    userId!: number;

    @Field(_type => User)
    @ManyToOne(() => User, user => user.votes)
    user: User;

    @Field()
    @PrimaryColumn()
    postId!: number;

    @Field(_type => Post)
    @ManyToOne(() => Post, post => post.votes)
    post: Post;

    @Field()
    @Column()
    value!: number;
}