import DataLoader from "dataloader";
import { User } from "../entities/User";
import { Vote } from "../entities/Vote";

interface VoteTypeCondition {
  postId: number
  userId: number
}

// TODO: parameter: userIds = [1, 2, 3]
// TODO: [{id: 1}, {id: 2}, {id: 3}]
const batchGetUsers = async (userIds: number[]) => {
    const users = await User.findByIds(userIds);
    return userIds.map(userId => users.find(user => user.id === userId));
}


//TODO: SELECT * FROM vote WHERE [postId, userId] IN ([[1, 1], [1, 2]])
const batchGetVoteTypes = async (voteTypeConditions: VoteTypeCondition[]) => {
  const votes = await Vote.findByIds(voteTypeConditions);
  return voteTypeConditions.map((voteTypeCondition) =>
    votes.find(
      (vote) =>
        vote.postId === voteTypeCondition.postId &&
        vote.userId === voteTypeCondition.userId
    )
  );
}

export const buildDataLoaders = () => ({
  userLoader: new DataLoader<number, User | undefined>((userIds) =>
    batchGetUsers(userIds as number[])
  ),
  voteTypeLoader: new DataLoader<VoteTypeCondition, Vote | undefined>(
    (voteTypeConditions) =>
      batchGetVoteTypes(voteTypeConditions as VoteTypeCondition[])
  ),
});