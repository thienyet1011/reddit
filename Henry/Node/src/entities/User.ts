import { Post } from './Post';
import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType() // Interact between typescript with graphql & type-graphql (as GraphQL type)
@Entity() // Interact typeorm with postgres circle
export class User extends BaseEntity {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  username: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Field(_type => [Post])
  @OneToMany(() => Post, post => post.user)
  posts: Post[]

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
