import { Resolver, Query, Ctx, UseMiddleware, Arg, Int } from 'type-graphql';
import { Project } from '../../entity/project';
import { ResolverContext } from '../../types/resolverContext';

@Resolver()
export class ProjectByIdResolver {
  @Query(() => Project)
  async projectById(
    @Arg('id', type => Int) id: number,
    @Ctx() ctx: ResolverContext
  ): Promise<Project | undefined> {
    console.log(ctx);
    const project = await Project.findOne(id);
    return project;
  }
}
