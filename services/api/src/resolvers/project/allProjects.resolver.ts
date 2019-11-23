import { Resolver, Query, Ctx, UseMiddleware, Arg, Int } from 'type-graphql';
import { Project } from '../../entity/project';

@Resolver()
export class AllProjects {
  @Query(() => [Project])
  async allProjects(): Promise<Project[]> {
    return await Project.find();
  }
}
