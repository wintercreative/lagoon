import {
  Resolver,
  Query,
  Ctx,
  UseMiddleware,
  Arg,
  Int,
  Mutation
} from 'type-graphql';
import { Project } from '../../entity/project';
import { AddProjectInput } from './inputs/addProjectInput';
import { ResolverContext } from '../../types/resolverContext';

@Resolver()
export class addProject {
  @Mutation(() => Project)
  async addProject(
    @Arg('input') input: AddProjectInput,
    @Ctx() ctx: ResolverContext
  ): Promise<Project | undefined> {
    console.log(ctx);
    const project = await Project.create({ ...input }).save();
    return project;
  }
}
