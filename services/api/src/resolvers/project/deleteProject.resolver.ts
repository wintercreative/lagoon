import { Resolver, Query, Ctx, UseMiddleware, Arg, Int } from 'type-graphql';
import { Project } from '../../entity/project';

@Resolver()
export class DeleteProjectById {
  @Query(() => String)
  async deleteProjectById(@Arg('id', type => Int) id: number): Promise<String> {
    const result = await Project.delete(id);
    return result.affected
      ? 'Success'
      : `Error: Project with ID ${id} could not be deleted.`;
  }
}
