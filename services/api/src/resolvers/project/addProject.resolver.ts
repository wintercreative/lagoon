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

@Resolver()
export class addProject {
  @Mutation(() => Project)
  async addProject(
    @Arg('input') input: AddProjectInput
  ): Promise<Project | undefined> {
    const project = await Project.create({ ...input }).save();
    return project;
  }
}
