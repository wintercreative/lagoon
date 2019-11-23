import { Resolver, Query, Ctx, UseMiddleware, Arg, Int } from 'type-graphql';
import { Project } from '../../entity/project';

@Resolver()
export class ProjectByIdResolver {
  @Query(() => Project)
  async projectById(
    @Arg('id', type => Int) id: number
  ): Promise<Project | undefined> {
    const project = await Project.findOne(id);
    return project;
  }
}
