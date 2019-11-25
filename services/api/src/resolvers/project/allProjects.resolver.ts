import { Resolver, Query, Ctx, UseMiddleware, Arg, Int } from 'type-graphql';
import { Project } from '../../entity/project';
import { ResolverContext } from '../../types/resolverContext';

@Resolver()
export class AllProjects {
  @Query(() => [Project])
  async allProjects(@Ctx() ctx: ResolverContext): Promise<Project[]> {
    console.log(ctx);
    return await Project.find();
  }
}
